const mongoose = require("mongoose");
const Schema = mongoose.Schema;

//User Schema

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minLength: 3,
    maxLength: 30,
  },

  firstName: {
    type: String,
    required: true,
    trim: true,
  },

  lastName: {
    type: String,
    required: false,
    trim: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  password: {
    type: String,
    required: true,
    minLength: 6,
  },
  transaction: [
    {
      type: Schema.Types.ObjectId,
      ref: "Transaction",
    },
  ],
});

const User = mongoose.model("User", userSchema);

//Accounts schema

const accountSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  balance: {
    type: Number,
    required: true,
  },
});

const Account = mongoose.model("Account", accountSchema);

//Transaction Schema

const transSchema = new Schema({
  toId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  fromId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  time: {
    type: Date,
    default: Date.now,
  },
});

const Transaction = mongoose.model("Transaction", transSchema);

module.exports = { User, Account, Transaction };
