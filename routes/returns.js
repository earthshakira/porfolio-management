var express = require('express');
var router = express.Router();


router.get('/', function(req, res, next) {
  console.log("req",req.body)
  res.json(req.body);
});

module.exports = router;
