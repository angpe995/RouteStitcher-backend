const express = require("express");
const router = express.Router();
const checkRouteAvailability = require("../controllers/checkRouteAvailability");
router.post(
  "/:connectionUUID/check",
  checkRouteAvailability.checkRoute,
);
module.exports = router;