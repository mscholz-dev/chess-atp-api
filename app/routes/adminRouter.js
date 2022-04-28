const router = require("express").Router();

const Middlewares = require("../middlewares");

const Controller = require("../controllers/adminController");
const AdminController = new Controller();

// admin user delete route
router.route(`/admin/user/delete/:username`).delete(Middlewares.admin, AdminController.userDelete);

// admin user search route
router.route(`/admin/users/search`).post(Middlewares.admin, AdminController.usersSearch);

module.exports = router;
