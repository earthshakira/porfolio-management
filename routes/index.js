/**
 * @file A Index Router
 * @overview Manages the Index Endpoints a
 */
var express = require('express');
var router = express.Router();
/**
 * @param  {} '/'
 * @param  {} function(req
 * @param  {} res
 * @param  {} next
 */
router.get('/', function(req, res, next) {
  res.redirect('/swagger');
});

module.exports = router;
