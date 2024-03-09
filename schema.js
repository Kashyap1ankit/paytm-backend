const zod = require("zod");

//User signup zod schema

const userSignupSchema = zod.object({
  username: zod
    .string({
      required_error: "Name is required",
      invalid_type_error: "Name must be a string",
    })
    .min(3, { message: "Must be 3 letters" })
    .max(30, { message: "Cannot be greater than 30 letters" }),

  firstName: zod.string({ required_error: "Name is required" }),

  lastName: zod.string(),

  email: zod
    .string({
      required_error: "Email is required",
      invalid_type_error: "Invalid Email type",
    })
    .email(),

  password: zod
    .string()
    .min(6, { message: "Cannot be less than 3 letters" })
    .max(10, { message: "Cannot be greater than 10 letters" }),
});

//User signin zod schema

const userSigninSchema = zod.object({
  username: zod.string(),
  password: zod.string().min(6).max(10),
});

//User sigin auth zod schema

const authSchema = zod.string().startsWith("Bearer ");

//User update zod schema

const updateSchema = zod.object({
  password: zod.string().min(6).max(10).optional(),
  firstName: zod.string().optional(),
  lastName: zod.string().optional(),
});

module.exports = {
  userSignupSchema,
  userSigninSchema,
  authSchema,
  updateSchema,
};
