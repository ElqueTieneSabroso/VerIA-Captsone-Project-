const express = require("express");
const router = express.Router();
const auth = require("../controllers/authController");

const {registerValidation} = require("../dbconfig/validation");
router.post("/register", registerValidation, auth.register);
router.post("/login", auth.login);
module.exports = router;