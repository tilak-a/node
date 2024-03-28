const User = require("../../models/user.model");

const getUserById = async (req, res) => {
  try {
    const id = req.params.id;

    const user = await User.findById(id).select("-password -__v");

    if (!user) {
      res.status(404).json({
        result: null,
        message: "User not found"
      });
    }

    res.status(200).json({
      result: user
    });
  } catch (error) {
    res.status(500).json({
      result: null,
      message: "cant find user"
    });
    console.log(`cant find user`);
  }
};

module.exports = getUserById;
