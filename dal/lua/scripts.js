const fs = require('fs')

exports.createUser = fs.readFileSync('./dal/lua/createUser.lua')