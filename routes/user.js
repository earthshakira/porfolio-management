var express = require('express');
const { createUser } = require('../dal/backend');
var router = express.Router();


router.post('/', async function(req, res) {
  try {
    let response = await createUser(req.body.username,req.body.password)
    res.json(response);  
  } catch (error) {
    res.status(400);
    res.json([error.toString().replace("ReplyError: ","")])
  }
  
});

module.exports = router;
