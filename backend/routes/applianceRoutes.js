const express = require("express")
const router = express.Router()
const { protect } = require("../middleware/authMiddleware")
const upload = require("../middleware/uploadMiddleware")
const { addAppliance, getAppliances, getAppliance, updateAppliance, deleteAppliance } = require("../controllers/applianceController")

router.post("/", protect, upload.single("image"), addAppliance)
router.get("/", protect, getAppliances)
router.get("/:id", protect, getAppliance)
router.put("/:id", protect, upload.single("image"), updateAppliance)
router.delete("/:id", protect, deleteAppliance)

module.exports = router
