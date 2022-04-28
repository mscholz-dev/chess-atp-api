const router = require("express").Router();
const { upload } = require("../utils/multer");

const Middlewares = require("../middlewares");

const Controller = require("../controllers/profileController");
const ProfileController = new Controller();

// profile user data route
router.route(`/profile`).post(ProfileController.index);

// profile username data route
router.route(`/profile/username`).post(Middlewares.auth, ProfileController.username);

// profile user history route
router.route(`/profile/history`).post(ProfileController.history);

// profile data route
router.route(`/profile/data`).post(Middlewares.auth, ProfileController.data);

// profile update route
router.route(`/profile/update`).patch(Middlewares.auth, upload.fields([{ name: "avatar", maxCount: 1 }]), ProfileController.update);

// profile search users route
router.route(`/profile/search`).post(ProfileController.search);

// profile last 7 days games
router.route(`/profile/stats/games`).post(ProfileController.statsGamesNumber);

module.exports = router;
