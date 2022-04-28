const router = require("express").Router();

const Middlewares = require("../middlewares");

const Controller = require("../controllers/gameController");
const GameController = new Controller();

// game player data route
router.route(`/game`).post(Middlewares.auth, GameController.index);

// game enemy data route
router.route(`/game/enemy`).post(Middlewares.auth, GameController.enemy);

// game history data route
router.route(`/game/history`).post(Middlewares.auth, GameController.history);

module.exports = router;
