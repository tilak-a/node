const express = require("express");
const router = express.Router();
const userRouter = require("./user.routes");

router.get("/", (req, res) => {
  res.status(200).json({
    status: 200,
    message: "API Connected"
  });
});

router.use("/user", userRouter);

router.get("*", (req, res) => {
  res.status(404).json({
    status: 404,
    message: "API Not Found"
  });
});

module.exports = router;
