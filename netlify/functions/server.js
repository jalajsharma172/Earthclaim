import serverless from "serverless-http";
import { createExpressApp } from "../../server/app";
let cachedHandler = null;
export const handler = async (event, context) => {
    if (!cachedHandler) {
        const { app } = await createExpressApp();
        const expressHandler = serverless(app, { provider: "aws" });
        cachedHandler = (evt, ctx) => expressHandler(evt, ctx);
    }
    return await cachedHandler(event, context);
};
