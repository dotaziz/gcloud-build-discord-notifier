import express from "express";
import { setUp, type AppContext } from "./setup";
import { renderMessage } from "./messaging";
import type { Build } from "./types";

interface PubSubPushBody {
  message: { data: string; messageId: string };
  subscription: string;
}

export function buildApp(ctx: AppContext) {
  const app = express();
  app.use(express.json());

  app.post("/", async (req, res) => {
    let build: Build;
    try {
      const body = req.body as PubSubPushBody;
      const decoded = Buffer.from(body.message.data, "base64").toString("utf8");
      build = JSON.parse(decoded) as Build;
    } catch (err) {
      // Malformed push envelope is never going to succeed on retry. ack it (2xx)
      // so Pub/Sub stops redelivering, but log loudly.
      console.error("failed to decode pubsub push body", err);
      res.status(204).send();
      return;
    }

    if (!ctx.filter(build)) {
      res.status(204).send();
      return;
    }

    console.log(`sending discord webhook for build ${build.id} (status: ${build.status})`);

    const view = { Build: build, Params: build.substitutions ?? {} };
    let message;
    try {
      message = renderMessage(build, view, ctx.template);
    } catch (err) {
      console.error("failed to render message", err);
      res.status(500).send(); // transient-looking — let Pub/Sub retry
      return;
    }
    if (!message) {
      res.status(204).send();
      return;
    }

    const resp = await fetch(ctx.webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(message),
    });
    await resp.arrayBuffer(); // drain, so that the connection can be reused by node-fetch

    if (resp.status === 401 || resp.status === 403) {
      // Permanent misconfiguration — retrying won't help. Ack so Pub/Sub stops,
      // but this should also page/alert separately from a transient failure.
      console.error(`discord webhook rejected credentials: ${resp.status}`);
      res.status(204).send();
      return;
    }
    if (!resp.ok) {
      // 429 / 5xx — transient, worth a Pub/Sub retry with backoff.
      console.error(`discord webhook returned ${resp.status}`);
      res.status(502).send();
      return;
    }

    res.status(204).send();
  });

  return app;
}

async function main() {
  const ctx = await setUp();
  const app = buildApp(ctx);
  const port = Number(process.env.PORT) || 8080;
  app.listen(port, () => console.log(`listening on :${port}`));
}

main().catch((err) => {
  console.error("fatal error during startup", err);
  process.exit(1);
});
