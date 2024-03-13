const express = require("express");
const router = express.Router();
const controllers = require("../controller/user/user.controller");
const { authenticateJWT } = require("../middleware/auth");
const { uploadMiddleware } = require("../middleware/multer");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

router.route("/register").post(controllers.registerUser);
router.route("/getAllUsers").get(authenticateJWT, controllers.getAllUsers);
router.route(`/getUserById/:id`).get(authenticateJWT, controllers.getUserById);
router.route("/login").post(controllers.loginUser);
router
  .route("/updateUserPassword")
  .patch(authenticateJWT, controllers.updateUser);
router.route("/deleteUser").delete(authenticateJWT, controllers.deleteUser);
router
  .route("/upload-profile-pic")
  .post(authenticateJWT, uploadMiddleware, controllers.userProfile);

module.exports = router;
