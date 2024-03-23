const express = require("express");
const { Account, Transaction, User } = require("../models/db");
const router = express.Router({ mergeParams: true });
const { authMiddleware } = require("../middlewares");
const { default: mongoose } = require("mongoose");

router.use(express.urlencoded({ extended: true }));
router.use(express.json());

router.use(authMiddleware);

//1.Route for user to get it's balance

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

//2.Route to send money to any other account

router.post("/transfer", async (req, res) => {
  //Transaction in db

  const session = await mongoose.startSession();

  session.startTransaction();
  let { to, amount, userId } = req.body;

  //Converting the string amount in number

  amount = Number(amount);

  //Finding the fromUser for balance
  const fromUser = await Account.findOne({ userId: userId });

  if (!fromUser) {
    await session.abortTransaction();
    return res.status(400).json({ message: "Account doesn't exits" });
  }

  //Finding the toUser for balance

  const toUser = await Account.findOne({ userId: to });

  if (!toUser) {
    await session.abortTransaction();
    return res.status(400).json({ message: "Account doesn't exits" });
  }

  //Checking for the amount validation

  if (fromUser.balance < amount) {
    await session.abortTransaction();
    return res.status(400).json({ message: "Insufficent balance" });
  }

  //Updating balance

  fromUser.balance -= amount;
  toUser.balance += amount;

  //Getting the users from the User model to update their transaction

  const fromUserAccount = await User.findById(userId);
  const toUserAccount = await User.findById(to);

  //Creating a new transaction

  const newTransaction = new Transaction({
    toId: toUserAccount.id,
    fromId: fromUserAccount.id,
    amount: amount,
  });

  await newTransaction.save();

  //Adding transaction reference in respective accounts

  fromUserAccount.transaction.push(newTransaction);
  toUserAccount.transaction.push(newTransaction);

  await fromUser.save();
  await toUser.save();
  await fromUserAccount.save();
  await toUserAccount.save();
  await session.commitTransaction();

  res.status(200).json({ message: "Transfer Successfully" });
});
module.exports = router;
