const User = require("../../models/user.model");
const genrateJwt = require("../../utils/genrateJwt");
const bcrypt = require("bcrypt");

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!password || !email) {
      return res.status(403).json({
        result: null,
        message: `Email and password are required`
      });
    }

    const foundUser = await User.findOne({ email: email });

    if (!foundUser) {
      return res.status(404).json({
        result: null,
        message: `Couldn't find the user with email`
      });
    }

    const checkedPassword = await bcrypt.compare(password, foundUser.password);

    // console.log(foundEmail, foundUser);

    // const foundUser = await User.findOne({
    //   $and: [{ email: email, password: unhashedPassword }]
    // });

    if (!foundUser || !checkedPassword) {
      return res.status(403).json({
        result: null,
        message: `Invalid email or password`
      });
    }

    // const token = jwt.sign(
    //   { _id: foundUser._id, name: foundUser.name, email: foundUser.email },
    //   process.env.JWT_SECRET,
    //   {
    //     expiresIn: "1h"
    //   }
    // );

    const token = genrateJwt(foundUser);

    const options = {
      httpOnly: true,
      secure: true,
      maxAge: 100000
    };

    if (foundUser && checkedPassword) {
      return res.cookie("token", token, options).status(200).json({
        result: token,
        userId: foundUser._id,
        message: `User login successful`
      });
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports = loginUser;
