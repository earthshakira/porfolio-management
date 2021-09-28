/**
 * These Lua scripts are meant for redis `EVAL` method.
 * As Redis is single threaded, the `EVAL` method is 
 * _Atomic_. This property is important if we want to 
 * ensure concistency in operations that involve 
 * check-and-set behaviour
 * @module LuaScripts
 */
const fs = require('fs')

/** 
 * The createuser adds 2 keys to redis 
 *  - `user.{username} = {password}` , this is used to ensure unique usernames and update passwords
 *  - `auth.{username}:{password} = 1` , this is used as a fast way to authenticate users to find username password matches
 * 
 */
exports.createUser = fs.readFileSync('./dal/lua/createUser.lua')
/** buying security does the following
 *  1. calculate a `tradeId` from a monotonically increasing key `tradeId.{user}`
 *  2. update the totalBuyPrice,shares and average buy price in the users portfolio
 *  3. uses `msgpk` to store the trade for update calculations
*/
exports.buySecurity = fs.readFileSync('./dal/lua/buySecurity.lua')
/** buying security does the following
 *  1. calculate a `tradeId` from a monotonically increasing key `tradeId.{user}`
 *  2. Decrease the quantity of stocks and check value
 *      1. if value is less than 0 then roll back and return error
 *      2. else goto 3
 *  3. update the totalBuyPrice the users portfolio
 *  4. uses `msgpk` to store the trade for update calculations
*/
exports.sellSecurity = fs.readFileSync('./dal/lua/sellSecurity.lua')