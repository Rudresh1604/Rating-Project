const express = require("express");
const router = express.Router();

const {
  addStore,
  getAllStore,
  getStoreFeedback,
  searchStore,
} = require("../controller/store");

router.post("/create", addStore);
router.get("/all", getAllStore);
router.get("/:storeId", getStoreFeedback);
