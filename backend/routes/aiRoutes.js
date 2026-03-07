const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { analyze, getHistory } = require("../controllers/aiController");

router.post("/analyze", protect, analyze);
router.get("/history", protect, getHistory);

module.exports = router;
