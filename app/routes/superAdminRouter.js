const router = require("express").Router();
const { upload } = require("../utils/multer");

const Middlewares = require("../middlewares");

const Controller = require("../controllers/superAdminController");
const SuperAdminController = new Controller();

// superAdmin admin delete route
router.route(`/superadmin/admin/delete/:username`).delete(Middlewares.superAdmin, SuperAdminController.adminDelete);

// superAdmin admin search route
router.route(`/superadmin/admins/search`).post(Middlewares.superAdmin, SuperAdminController.adminsSearch);

// superAdmin stats users number route
router.route(`/superadmin/stats/users/number`).post(Middlewares.superAdmin, SuperAdminController.statsUsersNumber);

// superAdmin create admin route
router.route(`/superadmin/create/admin`).post(Middlewares.superAdmin, upload.fields([{ name: "avatar", maxCount: 1 }]), SuperAdminController.adminCreate);

// superAdmin stats games number route
router.route(`/superadmin/stats/games/number`).post(Middlewares.superAdmin, SuperAdminController.statsGamesNumber);

module.exports = router;
