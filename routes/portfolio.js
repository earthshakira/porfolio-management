var express = require('express');
var router = express.Router();
const models = require('../dal/models');

router.get('/', async function(req, res, next) {
  let portfolio = new models.Portfolio(req.auth.user)
  res.json(await portfolio.get())
});

module.exports = router;
