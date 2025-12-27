import { attachFrontend, createExpressApp } from "./app.js";
import { log } from "./vite.js";
// Bootstrap server
(async () => {
    try {
        const { app, server } = await createExpressApp();
        await attachFrontend(app, server);
        const port = parseInt(process.env.PORT || "5000", 10);
        server.listen(port, () => {
            log(`serving on port ${port}`);
        });
    }
    catch (error) {
        console.error("Server startup failed:", error);
        process.exit(1);
    }
})();
