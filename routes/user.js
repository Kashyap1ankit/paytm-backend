const express = require("express");
const cors = require("cors");
const router = express.Router({ mergeParams: true });
const jwt = require("jsonwebtoken");
const {
  userSignupSchema,
  userSigninSchema,
  updateSchema,
} = require("../schema");
const { authMiddleware } = require("../middlewares");
const { User, Account } = require("../models/db");
const bcrypt = require("bcrypt");

router.use(express.urlencoded({ extended: true }));
router.use(express.json()); //Passing the json body

router.get("/", (req, res) => {
  res.send("user route");
});

router.use(cors());
//-------------------------------------------------Auth Route--------------------------------------------------------------------

router.get("/auth", authMiddleware, async (req, res) => {
  const userId = req.body.userId;
  const findUser = await User.findById(userId);
  if (!findUser) {
    return res.status(404).json({ message: "No such user found" });
  }
  return res
    .status(200)
    .json({ firstName: findUser.firstName, lastName: findUser.lastName });
});

//-------------------------------------------------Signup Route--------------------------------------------------------------------

router.post("/signup", async (req, res) => {
  const userDeatils = req.body;
  //Zod validation

  const { success } = userSignupSchema.safeParse(userDeatils);

  if (!success) {
    return res.status(411).json({ message: "Incorrect input " });
  }

  //Mongoose unique validation

  const user = await User.findOne({ username: userDeatils.username });
  const email = await User.findOne({ email: userDeatils.email });

  //If username or email exits then throws error

  if (user || email) {
    return res.status(411).json({ message: "Username / Email already taken" });
  }

  //If all thing right then creating a new user

  const newUser = new User(userDeatils);
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newUser.password, salt);
  newUser.password = hashedPassword;
  const balance = Math.floor(Math.random() * 10000 + 1);
  await newUser.save();

  const initalBalance = new Account({
    balance,
    userId: newUser.id,
  });

  await initalBalance.save();

  //Generating the jwt token

  const payload = {
    userId: newUser.id,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET_KEY);

  res.status(200).json({
    message: "new user created successfully",
    token: token,
  });
});

//-------------------------------------------------Signin Route--------------------------------------------------------------------

router.post("/signin", async (req, res) => {
  const userDeatils = req.body;

  //Zod valiadation
  const { success } = userSigninSchema.safeParse(userDeatils);

  if (!success) {
    return res.status(411).json({ message: "Incorrect input " });
  }

  //Finding the user

  const dbUser = await User.findOne({ username: userDeatils.username });

  //If user doesn't exist then sending error

  if (!dbUser) {
    return res
      .status(411)
      .json({ message: "No such Account found with this username" });
  }

  //If password doesn't exist then sending error

  const hashedPassword = await bcrypt.compare(
    userDeatils.password,
    dbUser.password
  );

  if (!hashedPassword) {
    return res
      .status(411)
      .json({ message: "No such Account found with this password" });
  }

  //If all fines then generating a token and then sending the message

  const payload = {
    userId: dbUser.id,
  };
  const token = jwt.sign(payload, process.env.JWT_SECRET_KEY);
  res.status(200).json({ token: token });
});

router.use(authMiddleware);

//-------------------------------------------------Updated Route--------------------------------------------------------------------

router.put("/", async (req, res) => {
  //First doing jwt authentication and then coming here

  let { password, firstName, lastName, userId } = req.body;

  //Doing the input validation usig the zod schema

  const { success } = updateSchema.safeParse({ password, firstName, lastName });

  if (!success) {
    return res.status(411).json({ message: "Invalid Inputs" });
  }

  //Finding the user from the database if doesn't exist then throwing the error

  let findUser = await User.findById(userId);
  if (!findUser) {
    return res.status(404).json({ message: "No such account found" });
  }

  //If some fields are not given then setting it to default

  if (!password) password = findUser.password;
  if (!firstName) firstName = findUser.firstName;
  if (!lastName) lastName = findUser.lastName;

  //Updating the user details and then finally saving it

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  findUser.password = hashedPassword;
  findUser.firstName = firstName;
  findUser.lastName = lastName;

  await findUser.save();

  res.status(200).json({ message: "Updated successfully" });
});

//-------------------------------------------------Get All User--------------------------------------------------------------------

router.get("/all", async (req, res) => {
  const allUser = await User.find();
  if (allUser && allUser.length <= 0) {
    return res.status(404).json({ message: "Users not found" });
  }

  const filteredUsers = allUser.filter((e) => {
    if (e._id != req.body.userId) {
      return e;
    }
  });
  res.status(200).json({
    users: filteredUsers,
  });
});

//-------------------------------------------------Search Users Route--------------------------------------------------------------------

router.get("/bulk", async (req, res) => {
  const { filter } = req.query;

  const getUser = await User.find({ username: filter });

  if (getUser && getUser.length <= 0) {
    return res.status(404).json({ message: "User not found" });
  }

  if (getUser[0].id === req.body.userId) {
    return res.status(404).json({ message: "User not found" });
  }
  res.status(200).json({
    allUsers: getUser,
  });
});

//-------------------------------------------------Delete Users Route--------------------------------------------------------------------

router.delete("/destroy", async (req, res) => {
  try {
    const { userId } = req.body;
    let user = await User.findByIdAndDelete(userId);
    let account = await Account.findOneAndDelete({ userId: userId });
    if (!user) throw new Error();
    if (!account) throw new Error();
    res.status(200).json({ message: "successfully deleted" });
  } catch (error) {
    res.status(404).json({ message: "Error occured" });
  }
});
//Error Handler

router.use((err, req, res, next) => {
  res.status(400).json({ err: err.message });
  next();
});

module.exports = router;
