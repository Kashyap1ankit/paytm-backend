const express = require("express");
const router = express.Router({ mergeParams: true });
const userRouter = require("./user");
const accountRouter = require("./account");

router.get("/", (req, res) => {
  res.send("router used");
});

// router.post("/auth", loginMiddleware);

router.use("/user", userRouter);
router.use("/account", accountRouter);

module.exports = router;
