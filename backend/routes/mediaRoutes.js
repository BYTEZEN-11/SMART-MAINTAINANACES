const express = require("express")
const router = express.Router()

const { uploadMedia } = require("../controllers/mediaController")
const { protect } = require("../middleware/authMiddleware")
const upload = require("../middleware/uploadMiddleware")

router.post("/", protect, upload.single("media"), uploadMedia)

module.exports = router