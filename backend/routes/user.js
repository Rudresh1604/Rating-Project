const express = require("express");
const router = express.Router();
const {
  getUserProfile,
  getAdminDashboard,
  getStoreOwnerDashboard,
  loginUser,
  registerUser,
} = require("../controller/user");
const auth = require("../middleware/auth");

const roleMiddleware = require("../middleware/roleMiddleware");
const { getMyRatings, updateRating } = require("../controller/rating");

router.get("/profile", auth, getUserProfile);
router.get(
  "/owner-dashboard",
  roleMiddleware(["OWNER", "ADMIN"]),
  getStoreOwnerDashboard
);
router.post("/login", loginUser);
router.post("/register", registerUser);
router.get(
  "/admin-dashboard",
  auth,
  roleMiddleware(["ADMIN"]),
  getAdminDashboard
);
router.get("/ratings", auth, getMyRatings);
router.put("/ratings/:ratingId", auth, updateRating);

module.exports = router;
