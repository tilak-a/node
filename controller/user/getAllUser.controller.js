const User = require("../../models/user.model");

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-password -email -__v");

    res.status(200).json({
      result: users
      // token: req.user
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports = getAllUsers;
