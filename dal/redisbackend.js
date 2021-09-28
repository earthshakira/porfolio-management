/**
 * @module Redis Backend
 */

const redis = require("redis");
const scripts = require("./lua/scripts")
const { promisify } = require("util");

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379"
let client = {}
let prefix = "p"
let ops = {}

exports.init = function(env) {
  client = redis.createClient(REDIS_URL);
  prefix = env
  keys = {
    USER: `${prefix}.user`,
  }
  ops = {
    EVAL: promisify(client.eval).bind(client),
    FLUSHALL: promisify(client.flushall).bind(client),
    GET: promisify(client.get).bind(client),
  }
}

exports.createUser = async function(username,password) {
  return await ops.EVAL([scripts.createUser,0,username,`${username}:${password}`])
}

exports.userAuthorizer = function(username, password,cb) {
  console.log("asdf",username,password)
  client.get(`auth.${username}:${password}`,(err,res) => {
    cb(null,res === "1")
  })
}

exports.reset = async function() {
  return await ops.FLUSHALL('SYNC')
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