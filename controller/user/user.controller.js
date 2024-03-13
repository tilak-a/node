const getAllUsers = require("./getAllUser.controller");
const registerUser = require("./registerUser.controller");
const loginUser = require("./loginUser.controller");
const getUserById = require("./getUserById.controller");
const updateUser = require("./updateUser.conroller");
const deleteUser = require("./deleteUser.controller");
const userProfile = require("./userProfile.controller");

module.exports = {
  getAllUsers,
  registerUser,
  loginUser,
  getUserById,
  updateUser,
  deleteUser,
  userProfile
};
