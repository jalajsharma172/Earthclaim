import { testConnection } from './db';

(async () => {
    console.log("Testing database connection...");
    const success = await testConnection();
    if (success) {
        console.log("Connection successful!");
        process.exit(0);
    } else {
        console.error("Connection failed.");
        process.exit(1);
    }
})();
