import { Strategy } from "passport-local";
import passport from "passport";
import bcrypt from "bcryptjs";
import UserDb from "../models/user";
import signupValidator from "../middleware/validator";

const authFields = {
  usernameField: "email",
  passwordField: "password",
  passReqToCallback: true,
};

passport.use(
  "signup",
  new Strategy(authFields, async (req, email, password, cb) => {
    // validate param
    const result = signupValidator(req.body);
    if (result.error) {
      return cb(null, false, { message: result.error.details[0].message });
    }

    const checkEmail = await UserDb.findOne({ email });
    if (checkEmail) {
      return cb(null, false, {
        statusCode: 409,
        message: "Email already exist",
      });
    }
    try {
      const salt = await bcrypt.genSalt(10);
      const hashPassword = await bcrypt.hash(req.body.password, salt);
      // enter param
      const newUser = new UserDb({
        email: req.body.email,
        password: hashPassword,
      });

      const savedUser = await newUser.save();
      cb(null, savedUser, {
        message: savedUser,
      });
    } catch (err) {
      return cb(null, false, { statusCode: 400, message: err });
    }
    return false;
  })
);

passport.use(
  "login",
  new Strategy(authFields, async (req, email, password, cb) => {
    const user = await UserDb.findOne({ email });

    if (!user || !user.password) {
      return cb(null, false, { message: "Incorrect email or password." });
    }

    const checkPassword = await user.validatePassword(password);

    if (!checkPassword) {
      return cb(null, false, { message: "Incorrect email or password." });
    }
    try {
      cb(null, user, {
        message: "Logged In Successfully",
      });
    } catch (err) {
      return cb(null, false, { statusCode: 400, message: err });
    }
    return false;
  })
);
