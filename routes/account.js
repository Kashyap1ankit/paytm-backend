const express = require("express");
const { Account } = require("../models/db");
const router = express.Router({ mergeParams: true });
const { authMiddleware } = require("../middlewares");
const { default: mongoose } = require("mongoose");

router.use(express.urlencoded({ extended: true }));
router.use(express.json());

router.use(authMiddleware);
//Route for user to get it's balance

router.get("/balance", async (req, res) => {
  //First token validation is done
  const userId = req.body.userId;

  //Finding the account which has the userId is same as userId in body

  const getAccount = await Account.findOne({ userId: userId });

  //If user not exits then sending error

  if (!getAccount) {
    return res.status(404).json({ message: "No such account found" });
  }

  res.status(200).json({ balance: getAccount.balance });
});

//Route to send money to any other account

router.post("/transfer", async (req, res) => {
  const session = await mongoose.startSession();

  session.startTransaction();
  let { to, amount, userId } = req.body;

  amount = Number(amount);
  const fromUser = await Account.findOne({ userId: userId });

  if (!fromUser) {
    await session.abortTransaction();
    return res.status(400).json({ message: "Account doesn't exits" });
  }

  const toUser = await Account.findOne({ userId: to });

  if (!toUser) {
    await session.abortTransaction();
    return res.status(400).json({ message: "Account doesn't exits" });
  }

  if (fromUser.balance < amount) {
    await session.abortTransaction();
    return res.status(400).json({ message: "Insufficent balance" });
  }

  fromUser.balance -= amount;
  toUser.balance += amount;

  await fromUser.save();
  await toUser.save();

  await session.commitTransaction();

  res.status(200).json({ message: "Transfer Successfully" });
});
module.exports = router;
