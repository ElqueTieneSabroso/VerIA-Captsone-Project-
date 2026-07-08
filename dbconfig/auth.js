const express = require("express");
const router = express.Router();
const controller = require("./controller");

router.post("/login", controller.login);
router.post("/register", controller.register);
module.exports = router;




/* 
const express = require("express");
const router = express.Router();
const auth = require("../dbconfig/controller");

const {registerValidation} = require("../dbconfig/validation");
router.post("/register", registerValidation, auth.register);
router.post("/login", auth.login);
module.exports = router;
*/

