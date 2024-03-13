const User = require("../../models/user.model");
const genrateJwt = require("../../utils/genrateJwt");
const bcrypt = require("bcrypt");

const registerUser = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // console.log("name", name);

    if (!password || !email || !name || !confirmPassword) {
      return res.status(403).json({
        result: null,
        message: `Name, email, password and confirm password are required`
      });
    }

    if (password !== confirmPassword) {
      return res.status(403).json({
        result: null,
        message: `Password and confirm password does not match`
      });
    }

    const prevUser = await User.findOne({
      $or: [{ email }, { name }]
    });

    if (prevUser) {
      return res.status(401).json({
        result: null,
        message: `User with name or email already exists`
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name: name,
      email: email,
      password: hashedPassword
    });

    await newUser.save();

    // const token = jwt.sign(
    //   { _id: newUser._id, name: newUser.name, email: newUser.email },
    //   process.env.JWT_SECRET,
    //   {
    //     expiresIn: "1h"
    //   }
    // );

    const token = genrateJwt(newUser);

    const options = {
      httpOnly: true,
      secure: true,
      maxAge: 100000
    };

    // res.status(201).json({
    //   message: "User registered successfully",
    //   user: newUser,
    //   token: token
    // });
    res.cookie("token", token, options).status(200).json({
      result: token,
      userId: newUser._id,
      message: `User Register successful`
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({
      message: "Internal server error"
    });
  }
};

module.exports = registerUser;
