var express = require('express');
var router = express.Router();
const models = require('../dal/models');

const MAGIC_RETURNS = 100
router.get('/', async function(req, res, next) {
  let portfolio = new models.Portfolio(req.auth.user)
  let portfolioData = await portfolio.get()
  let returns = 0
  portfolioData.forEach(item => {
    returns += (parseFloat(item.price) -  MAGIC_RETURNS) * item.shares
  })
  res.json({returns})
});

module.exports = router;
