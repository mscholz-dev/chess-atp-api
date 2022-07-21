const app = require("../app");

const httpServer = require("./httpServer.js");

httpServer.httpServer(app);
console.debug("If you need to use Https server you must enable https and set path to key.pem and server.crt in config.properties");
