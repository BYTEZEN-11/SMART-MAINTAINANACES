const express = require("express")
const router = express.Router()
const { protect } = require("../middleware/authMiddleware")
const upload = require("../middleware/uploadMiddleware")
const { createReport, getReports } = require("../controllers/reportController")

router.post("/", protect, upload.single("file"), createReport)
router.get("/", protect, getReports)

module.exports = router
