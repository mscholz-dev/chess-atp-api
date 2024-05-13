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
const path = require("path");

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
    method: ["GET", "POST", "OPTIONS"],
    credentials: true,
    allowedHeaders: [
      "Origin",
      "Content-Type",
      "Content-Length",
      "X-Requested-With",
      "cache-control",
    ],
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
    allowedHeaders: [
      "Origin",
      "Content-Type",
      "Content-Length",
      "X-Requested-With",
      "cache-control",
      "Access-Control-Allow-Methods",
      "Access-Control-Allow-Origin",
    ],
  })
);

app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  res.header("Access-Control-Allow-Credentials", true);
  res.header("Access-Control-Allow-Origin", process.env.FRONT_URL);
  res.header(
    "Access-Control-Allow-Methods",
    "GET,PUT,POST,DELETE,UPDATE,OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept"
  );
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
  socket.on("game:finishing", (arg) =>
    finishingGameController(socket, io, arg)
  );

  // when socket disconnecting
  socket.on("disconnecting", () => disconnectingController(socket));

  // when socket disconnecting, update timers
  socket.on("game:update", (arg) => updateGameController(socket, arg));

  // try reconnecting player
  socket.on("game:reconnecting", () => reconnectingGameController(socket));

  // socket cancel searching event
  socket.on("game:cancelSearching", () =>
    cancelSearchingGameController(socket, io)
  );

  socket.on("game:requestEquality", () =>
    requestEqualityGameController(socket)
  );
};

// socket.io listener middleware
io.on("connection", connectionSocket);

// api routes
app.use("/api", routes);

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  return res.contentType("html").send(`
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" href="favicon.ico" />
    <title>Chess ATP API</title>
    <style type="text/css">
      html,
      body {
        height: 100vh;
        margin: 0;
        overflow: hidden;
        padding: 0;
        width: 100vw;
      }

      main {
        animation: rainbow 18s ease infinite;
        background: linear-gradient(
          124deg,
          #ff2400,
          #e81d1d,
          #e8b71d,
          #e3e81d,
          #1de840,
          #1ddde8,
          #2b1de8,
          #dd00f3,
          #dd00f3
        );
        background-size: 1800% 1800%;
        bottom: 0;
        display: flex;
        flex-direction: column;
        height: 100%;
        justify-content: center;
        left: 0;
        position: absolute;
        right: 0;
        top: 0;
        width: 100%;
      }

      div {
        margin: 0 auto 24px;
        padding: 0 12px;

        &:last-child {
          margin-bottom: 0;
        }
      }

      h1,
      a {
        color: white;
        font-family: sans-serif;
        font-size: 32px;
        margin: 0;
        padding: 0;
      }

      h1 {
        font-size: 48px;
        text-align: center;
      }

      a {
        font-size: 32px;
      }

      @keyframes rainbow {
        0% {
          background-position: 0% 82%;
        }
        50% {
          background-position: 100% 19%;
        }
        100% {
          background-position: 0% 82%;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <div>
        <h1>Créé par Morgan Scholz avec ❤️</h1>
      </div>
      <div>
        <a href="https://mscholz.dev" target="_blank">https://mscholz.dev</a>
      </div>
      <div>
        <a href="mailto:mscholz.dev@gmail.com" target="_blank"
          >mscholz.dev@gmail.com</a
        >
      </div>
    </main>
  </body>
</html>

  `);
});

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
