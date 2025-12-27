import { createExpressApp } from "../server/app.js";
import serverless from "serverless-http";
import express from "express";

const app = express();

// Initialize app implementation
let serverlessHandler: any;

async function setup(req: any, res: any) {
  if (!serverlessHandler) {
    const { app: internalApp } = await createExpressApp();
    app.use(internalApp);
    serverlessHandler = serverless(app);
  }
  return serverlessHandler(req, res);
}

export default setup;
