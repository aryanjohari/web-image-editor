/**
 * Vite plugin: same-origin POST /api/talk under `npm run dev`.
 */

import type { Plugin } from "vite";
import { loadEnv } from "vite";
import { talkMiddleware } from "./talk";

export function prismTalkApi(): Plugin {
  return {
    name: "prism-talk-api",
    configureServer(server) {
      const env = loadEnv(server.config.mode, server.config.envDir ?? process.cwd(), "");
      if (env.GEMINI_API_KEY) {
        process.env.GEMINI_API_KEY = env.GEMINI_API_KEY;
      }
      server.middlewares.use(talkMiddleware);
    },
  };
}
