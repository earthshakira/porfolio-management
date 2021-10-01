/**
 * This is an implementation for the backend, which handles all calls to redis 
 * It also formats input and output to make it more usable for our case
 * @module Redis Backend
 */

const redis = require("redis");
const scripts = require("./lua/scripts")
const { promisify } = require("util");

const REDIS_URL = process.env.REDISCLOUD_URL || "redis://localhost:6379"
let client = {}
let prefix = "p"
let ops = {}

const decodeTrade = (r) => ({tradeId: r[0],tickerSymbol: r[1],totalCost: r[2],totalShares: r[3],averagePrice: r[4]})

/**
 * The init function initializes the Redis connection and creates promisified of redis operations like `EVAL`,`GET` and `FLUSHALL`
 */
exports.init = function() {
  client = redis.createClient(REDIS_URL);
  keys = {
    USER: `${prefix}.user`,
  }
  ops = {
    EVAL: promisify(client.eval).bind(client),
    FLUSHALL: promisify(client.flushall).bind(client),
    GET: promisify(client.get).bind(client),
  }
}

/**
 * Fires the CreateUser script
 * @param  {string} username
 * @param  {string} password
 */
exports.createUser = async function(username,password) {
  return await ops.EVAL([scripts.createUser,0,username,`${username}:${password}`])
}

/**
 * Authorizes a user using the `auth.{username}:{password}` key in redis
 * @param  {string} username
 * @param  {string} password
 * @param  {} cb - Callback for Async User Authorization in `express-basic-auth` package
 */
exports.userAuthorizer = function(username, password,cb) {
  client.get(`auth.${username}:${password}`,(err,res) => {
    cb(null,res === "1")
  })
}

/** 
 * Clears the entire redis database mostly only used to create a clean instance 
 * while testing  
 */
exports.reset = async function() {
  return await ops.FLUSHALL('SYNC')
}
/**
 * Fires the buySecurity script. {@link module:LuaScripts.buySecurity}
 * @param  {string} user
 * @param  {string} tickerSymbol
 * @param  {number} price
 * @param  {number} quantity
 */
exports.buySecurity = async function(user,tickerSymbol,price,quantity) {
  let r = await ops.EVAL([scripts.buySecurity,0,user,tickerSymbol,price,quantity])
  return decodeTrade(r)
}

/**
 * Fires the sellSecurity script. {@link module:LuaScripts.sellSecurity}
 * @param  {string} user
 * @param  {string} tickerSymbol
 * @param  {number} price
 * @param  {number} quantity
 */
exports.sellSecurity = async function(user,tickerSymbol,price,quantity) {
  let r = await ops.EVAL([scripts.sellSecurity,0,user,tickerSymbol,price,quantity])
  return decodeTrade(r)
}

exports.updateSecurity = async function(tradeId,user,tickerSymbol,price,quantity,type,isDelete) {
  if(type === undefined) {
      type = ''
  }
  if(tickerSymbol === undefined) {
      tickerSymbol = ''
  }
  if(price === undefined) {
      price = ''
  }
  if(quantity === undefined) {
      quantity = ''
  }
  let r = await ops.EVAL([scripts.updateSecurity,0,user,tickerSymbol,price,quantity,tradeId,type,isDelete||'0'])
  return decodeTrade(r)
}

exports.close = async function() {
  await new Promise((resolve) => {
      client.quit(() => {
        resolve();
      });
  });
  // redis.quit() creates a thread to close the connection.
  // We wait until all threads have been run once to ensure the connection closes.
  await new Promise(resolve => setImmediate(resolve));
}