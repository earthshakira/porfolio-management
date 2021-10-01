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
 * {@link https://github.com/earthshakira/portfolio-management/blob/master/dal/lua/createUser.lua| Create User Script Source (.lua)} 
 * 
 * The createuser adds 2 keys to redis 
 *  - `user.{username} = {password}` , this is used to ensure unique usernames and update passwords
 *  - `auth.{username}:{password} = 1` , this is used as a fast way to authenticate users to find username password matches
 */
exports.createUser = fs.readFileSync('./dal/lua/createUser.lua')


/**
 * {@link https://github.com/earthshakira/portfolio-management/blob/master/dal/lua/buySecurity.lua| Buy Security Script Source (.lua)} 
 * 
 * buying security does the following
 *  1. calculate a `tradeId` from a monotonically increasing key `tradeId.{user}`
 *  2. update the totalBuyPrice,shares and average buy price in the users portfolio
 *  3. uses `msgpk` to store the trade for update calculations
 * 
*/
exports.buySecurity = fs.readFileSync('./dal/lua/buySecurity.lua')


/** 
 * {@link https://github.com/earthshakira/portfolio-management/blob/master/dal/lua/sellSecurity.lua| Sell Security Script Source (.lua)} 
 * 
 * buying security does the following
 *  1. calculate a `tradeId` from a monotonically increasing key `tradeId.{user}`
 *  2. Decrease the quantity of stocks and check value
 *      1. if value is less than 0 then roll back and return error
 *      2. else goto 3
 *  3. update the totalBuyPrice the users portfolio
 *  4. uses `msgpk` to store the trade for update calculations
 * 
*/
exports.sellSecurity = fs.readFileSync('./dal/lua/sellSecurity.lua')



/** 
 * {@link https://github.com/earthshakira/portfolio-management/blob/master/dal/lua/updateTrade.lua| Update Trade Script Source (.lua)} 
 * 
 * The Update Script is used for UPDATE/DELETE operations
 *  It's strongly consistent for all operations as it only does changes to the db
 *  if the entire sequence of operations is valid, else backs off.
 *  It considers 2 cases
 *  1. Trades where tickerSymbol is not updated
 *      1. Get a list of all the trades
 *      2. Initialize the state to 0 shares, 0 price
 *      3. Start performing the trades one by one
 *      4. If the ID of the trade matches
 *          1. If operation is delete, ignore the trade
 *          2. Else, perform the updated trade
 *      5. Use the newState to calculate values of the portfolio
 *  2. Trades Where the tickerSymbol is updated
 *      1. This will follow the above method for 2 stocks
 *      2. It will delete the trade from the old Symbol
 *      3. Calculate the newState for the old Symbol
 *      4. Insert the trade in the new Symbol
 *      5. Calculate the newState for the new Symbol
 *      6. Update the portfolio for both the symbols
 * 
 */
exports.updateSecurity = fs.readFileSync('./dal/lua/updateTrade.lua')


/** 
 * {@link https://github.com/earthshakira/portfolio-management/blob/master/dal/lua/getAllTrades.lua| Get All Trades Script Source (.lua)} 
 * 
 * 
 */
 exports.getAllTrades = fs.readFileSync('./dal/lua/getAllTrades.lua')