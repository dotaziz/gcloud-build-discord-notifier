import { readFile } from "node:fs/promises";
import {load} from "js-yaml";
import { Storage } from "@google-cloud/storage";
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
import type { NotifierConfig } from "./types";
import { compileFilter, type Predicate } from "./filter";
import { compileTemplate } from "./messaging";



export interface AppContext {
  webhookUrl: string;
  filter: Predicate;
  template?: HandlebarsTemplateDelegate<any>;
}

async function loadConfigYaml(configPath: string): Promise<string> {
  if (configPath.startsWith("gs://")) {
    const [, , bucket, ...rest] = configPath.split("/");
    const storage = new Storage();
    const [contents] = await storage.bucket(bucket!).file(rest.join("/")).download();
    return contents.toString("utf8");
  }
  return readFile(configPath, "utf8");
}

async function resolveSecret(resourceName: string): Promise<string> {
  const client = new SecretManagerServiceClient();
  const [version] = await client.accessSecretVersion({ name: resourceName });
  const payload = version.payload?.data?.toString();
  if (!payload) throw new Error(`empty secret payload for ${resourceName}`);
  return payload;
}

export async function setUp(): Promise<AppContext> {
  const configPath = process.env.CONFIG_PATH;
  if (!configPath) throw new Error("CONFIG_PATH env var is required");

  const raw = await loadConfigYaml(configPath);
  const cfg = load(raw) as NotifierConfig;

  const secretRef = cfg.spec.notification.delivery.webhookUrl.secretRef;
  const secretEntry = cfg.spec.secrets.find((s) => s.name === secretRef);
  if (!secretEntry) throw new Error(`no secret named ${secretRef} in spec.secrets`);
  const webhookUrl = await resolveSecret(secretEntry.value);

  return {
    webhookUrl,
    filter: compileFilter(cfg.spec.notification.filter),
    template: cfg.spec.notification.template
      ? compileTemplate(cfg.spec.notification.template)
      : undefined,
  };
}
