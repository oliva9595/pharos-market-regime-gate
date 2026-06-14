const ExecutionEngineSDK = require("./sdk");

if (require.main === module) {
    console.log("Starting API Server via index.js...");
    try {
        const { start } = require("./services/api/dist/server.js");
        if (typeof start === "function") {
            start();
        } else {
            console.error("Error: start function is not exported from server.js");
        }
    } catch (err) {
        console.error("Failed to load/start API server:", err);
    }
}

module.exports = {
    ExecutionEngineSDK
};
