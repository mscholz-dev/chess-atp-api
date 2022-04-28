const router = require("express").Router();
const { upload } = require("../utils/multer");

const Middlewares = require("../middlewares");

const Controller = require("../controllers/authController");
const AuthController = new Controller();

// auth route
router.route(`/auth`).post(Middlewares.auth, AuthController.index);

// register route
router.route(`/register`).post(upload.fields([{ name: "avatar", maxCount: 1 }]), AuthController.register);

// login route
router.route(`/login`).post(AuthController.login);

// admin auth route
router.route(`/auth/admin`).post(Middlewares.admin, AuthController.index);

// super admin auth route
router.route(`/auth/superadmin`).post(Middlewares.superAdmin, AuthController.index);

module.exports = router;
