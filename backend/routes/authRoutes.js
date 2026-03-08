const express = require("express")
const router = express.Router()

const { register, login, syncAccount, logout } = require("../controllers/authController")
const { validateRegister, validateLogin } = require("../middleware/validation")
const authRateLimiter = require("../middleware/authRateLimiter")
const { protect } = require("../middleware/authMiddleware")

const authLimiter = authRateLimiter(900000, 5) 

const syncLimiter = authRateLimiter(3600000, 10)

router.post("/register", authLimiter, validateRegister, register)
router.post("/login", authLimiter, validateLogin, login)
router.post("/sync", syncLimiter, syncAccount)
router.post("/logout", protect, logout)

module.exports = router
