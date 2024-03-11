const { User } = require("./models/db");
const { authSchema } = require("./schema");
const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const { success } = authSchema.safeParse(req.headers.authorization);

  if (!success) {
    return res.status(403).json({ message: "Invlaid token type" });
  }

  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.body.userId = decoded.userId;
  } catch (error) {
    return res.status(403).json({ message: "Invalid token" });
  }
  next();
};

module.exports = {
  authMiddleware,
};
