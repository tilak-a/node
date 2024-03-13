const User = require("../../models/user.model");

const deleteUser = async (req, res) => {
  try {
    const userId = req.authm?._id;

    if (!userId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: User not authenticated" });
    }

    // Delete the user by ID
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      user: deletedUser,
      message: "User deleted successfully"
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports = deleteUser;
