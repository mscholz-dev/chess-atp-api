// utils imports
require("dotenv").config();
const http = require("http");
const PORT = process.env.PORT;
const cookieParser = require("cookie-parser");
const cors = require("cors");
// const csurf = require("csurf");
// const session = require("express-session");
const logger = require("morgan");
// const FileStore = require("session-file-store")(session);

// express imports
const express = require("express");
const routes = require("./app/routes")();

// mysql imports
// const { connection } = require("./app/utils/connection");

// socket.io imports
const socketIo = require("socket.io");
const authSocket = require("./app/socket/middlewares/authSocket");
const searchGameController = require("./app/socket/controllers/game/searchGameController");
const movingGameController = require("./app/socket/controllers/game/movingGameController");
const castlingGameController = require("./app/socket/controllers/game/castlingGameController");
const finishingGameController = require("./app/socket/controllers/game/finishingGameController");
const disconnectingController = require("./app/socket/controllers/disconnectingController");
const updateGameController = require("./app/socket/controllers/game/updateGameController");
const reconnectingGameController = require("./app/socket/controllers/game/reconnectingGameController");
const cancelSearchingGameController = require("./app/socket/controllers/game/cancelSearchingGameController");
const requestEqualityGameController = require("./app/socket/controllers/game/requestEqualityGameController");

// create express server
const app = express();
const server = http.createServer(app);

// create socket.io server
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONT_URL,
    method: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Origin", "Content-Type", "Authorization", "Content-Length", "X-Requested-With", "cache-control", "apikey", "apisecret"],
  },
});

// connection to mysql
// connection.connect();

// connection.on("error", (err) => {
//   console.log("MYSQL ERROR => ", err);
//   connection.connect();
// });

// dev logger
app.use(logger("dev"));

// session middleware
// app.use(
//   session({
//     secret: process.env.SESSION_SECRET,
//     saveUninitialized: true,
//     resave: false,
//     unset: "destroy",
//     cookie: { maxAge: 60 * 60 * 24 },
//     store: new FileStore({
//       path: "tmp/sessions/",
//       useAsync: true,
//       reapInterval: 5000,
//       maxAge: 60 * 60 * 24,
//     }),
//   })
// );

// utils express middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// access to uploads directory
app.use("/uploads", express.static(`${__dirname}/uploads`));

// cors settings
app.use(
  cors({
    origin: process.env.FRONT_URL,
    credentials: true,
    methods: ["GET", "POST", "OPTIONS", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Origin", "Content-Type", "Authorization", "Content-Length", "X-Requested-With", "cache-control"],
  })
);

app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  res.header("Access-Control-Allow-Credentials", true);
  res.header("Access-Control-Allow-Origin", process.env.FRONT_URL);
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,UPDATE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept");
  next();
});

// disable trash header
app.disable("x-powered-by");

// setting security response headers
app.use((req, res, next) => {
  // prevent xss failure
  res.header("X-XSS-Protection", "1; mode=block");
  // prevent iframe
  res.header("X-Frame-Options", "deny");
  // prevent mime sniffing
  res.header("X-Content-Type-Options", "nosniff");
  next();
});

// app.use(csurf({ cookie: true }));

const connectionSocket = (socket) => {
  // socket.io auth middleware
  socket.use((e, next) => authSocket(socket, next));

  // search a game event
  socket.on("game:search", () => searchGameController(socket, io));

  // when a player move a piece
  socket.on("game:moving", (arg) => movingGameController(socket, arg));

  //when a player do a castle
  socket.on("game:castling", (arg) => castlingGameController(socket, arg));

  // delete finished room
  socket.on("game:finishing", (arg) => finishingGameController(socket, io, arg));

  // when socket disconnecting
  socket.on("disconnecting", () => disconnectingController(socket));

  // when socket disconnecting, update timers
  socket.on("game:update", (arg) => updateGameController(socket, arg));

  // try reconnecting player
  socket.on("game:reconnecting", () => reconnectingGameController(socket));

  // socket cancel searching event
  socket.on("game:cancelSearching", () => cancelSearchingGameController(socket, io));

  socket.on("game:requestEquality", () => requestEqualityGameController(socket));
};

// socket.io listener middleware
io.on("connection", connectionSocket);

// api routes
app.use("/api", routes);

// server listener
server.listen(PORT, () => {
  console.log(`
  --------------------------------
  Listening on port: ${PORT}
  --------------------------------
         ___       _____     __
        /   \\     |   _  \\  |  |
       /  ^  \\    |  |_)  | |  |
      /  /_\\  \\   |   ___/  |  |
     /  _____  \\  |  |      |  |
    /__/     \\__\\ |__|      |__|

  --------------------------------
  `);
});

// export Express API
module.exports = app;
