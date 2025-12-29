import { createExpressApp } from "../server/app.js";
import serverless from "serverless-http";
import express from "express";

// Solution 2: Express properly configured for Vercel
const app = express();
let serverlessHandler: any;

async function setup(req: any, res: any) {
  try {
    if (!serverlessHandler) {
      console.log("[Vercel] Initializing Express App...");
      const start = Date.now();

      // Initialize the app (this connects to DB)
      const { app: internalApp } = await createExpressApp();

      console.log(`[Vercel] App initialized in ${Date.now() - start}ms`);

      app.use(internalApp);
      serverlessHandler = serverless(app);
    }

    return serverlessHandler(req, res);
  } catch (error) {
    console.error("[Vercel] Critical Initialization Error:", error);
    // Return a visible error to the client instead of timing out
    res.status(500).json({
      error: "Server Initialization Failed",
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

export default setup;
