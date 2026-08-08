import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { buildApp } from "../src/server";
import path from "path/win32";

describe("POST /", () => {
  it("204s and posts to the webhook on a matching build", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 204 }),
    );
    const app = buildApp({
      webhookUrl: "https://discord.example/webhook",
      filter: () => true,
      template: undefined,
    });

    const build = { id: "b1", projectId: "p", status: "SUCCESS", logUrl: "https://x" };
    const data = Buffer.from(JSON.stringify(build)).toString("base64");

    const res = await request(app)
      .post("/")
      .send({ message: { data, messageId: "1" }, subscription: "s" });

    expect(res.status).toBe(204);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://discord.example/webhook",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
