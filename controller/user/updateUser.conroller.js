const User = require("../../models/user.model");
const bcrypt = require("bcrypt");

const UpdateUser = async (req, res) => {
  try {
    const { password } = req.body;
    const id = req.authm?._id;

    if (!password) {
      return res.status(403).json({
        result: null,
        message: `Password is required`
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const foundUser = await User.findByIdAndUpdate(id, {password: hashedPassword });

    if (!foundUser) {
      return res.status(403).json({
        result: null,
        message: `Something went wrong. Please try login again`
      });
    }

    if (foundUser) {
      return res.status(200).json({
        message: `Password Updated successfully`
      });
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports = UpdateUser;
