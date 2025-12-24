
import type { Express } from "express";
import fs from "fs";
import path from "path";
import { type Server } from "http";
import { nanoid } from "nanoid";

export async function setupViteDev(app: Express, server: Server) {
  // dynamic import so this module can be safely required in production builds
  const { createServer: createViteServer, createLogger } = await import("vite");
  const viteLogger = createLogger();

  // import vite config dynamically (no top-level await outside async function)
  const { default: viteConfig } = await import("../vite.config");

  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    // ensure Vite doesn't try to re-read the config file from disk
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg: string, options?: any) => {
        viteLogger.error(msg, options);
        viteLogger.error(msg, options);
        // make dev failures loud
        // process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  // mount vite middlewares
  app.use(vite.middlewares);

  // serve transformed index.html for all routes during dev
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      // use process.cwd() so bundlers that produce CJS won't break on import.meta
      const clientTemplate = path.resolve(process.cwd(), "client", "index.html");

      let template = await fs.promises.readFile(clientTemplate, "utf-8");

      // cache-bust the client entry during dev to force fresh transforms
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );

      const page = await (vite as any).transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (err) {
      // give helpful stack traces for Vite
      try {
        (vite as any).ssrFixStacktrace(err as Error);
      } catch {
        /* ignore if ssrFixStacktrace not available */
      }
      next(err);
    }
  });
}