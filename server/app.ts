import express, { type Request, Response, NextFunction } from "express";

import { serveStatic, log } from "./vite";
import { initializeDatabase } from "./dbInit";
import { type Server } from "http";
import { registerRoutes } from "./routes";
import { detectClosedLoopsHandler } from "./loop_detection.ts";

export async function createExpressApp(): Promise<{ app: express.Express; server: Server }> {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json.bind(res) as (body?: any) => Response;
    res.json = function (bodyJson?: any) {
      capturedJsonResponse = bodyJson as Record<string, any> | undefined;
      return originalResJson(bodyJson);
    } as any;

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          try {
            logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
          } catch {}
        }
        if (logLine.length > 80) {
          logLine = logLine.slice(0, 79) + "…";
        }
        console.log(logLine);
        log(logLine);
      }
    });

    next();
  });

  await initializeDatabase();
  const httpServer = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

app.post('/api/detect-loops', (req, res) => {
    // Let detectClosedLoopsHandler handle sending the response

    try {
      const detect= detectClosedLoopsHandler(req, res);
      console.log(detect);
       
    } catch (err) {
      console.log('Error in detection python file ',err);
      
    }
});



















  return { app, server: httpServer };
} 

export async function attachFrontend(app: express.Express, server: Server) {
  if (app.get("env") === "development") {
    const { setupViteDev } = await import("./viteDev");
    await setupViteDev(app, server);
    return;
  }
  serveStatic(app);
}

