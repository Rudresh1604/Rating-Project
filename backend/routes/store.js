const express = require("express");
const router = express.Router();
const roleMiddleware = require("../middleware/roleMiddleware");
const auth = require("../middleware/auth");
const {
  addStore,
  getAllStore,
  getStoreFeedback,
  searchStore,
} = require("../controller/store");
const { addRating } = require("../controller/rating");

router.post("/create", auth, roleMiddleware(["OWNER"]), addStore);
router.get("/all", getAllStore);
router.get("/search", searchStore);
router.get("/:storeId", getStoreFeedback);
router.post("/ratings", auth, addRating);

module.exports = router;
