--[=====[
    ARGV[1] = username
    ARGV[2] = tickerSymbol
    ARGV[3] = totalAmount [price * shares]
    ARGV[4] = shares
--]=====]

local portfolio = 'portfolio.'..ARGV[1]
local tradeId = redis.call('INCR','tradeId.'..ARGV[1])

local amount = tonumber(ARGV[3])
local quantity = tonumber(ARGV[4])

local newAmount = redis.call('HINCRBY',portfolio,ARGV[2]..'.p',amount)          -- increase the total price of the bought shares
local newQuantity = redis.call('HINCRBY',portfolio,ARGV[2]..'.q',quantity)      -- increase the total quantity of the shares
redis.call('HSET',portfolio,ARGV[2]..'.a',newAmount/newQuantity)             -- calculate the pershare average for the shares

local trade =  cmsgpack.pack(tradeId,'B',ARGV[2],amount,quantity)               -- generate a packed version of the trade
redis.call('HSET','trades.'..ARGV[1],tradeId,trade)                     -- store a copy of the trade as a list
redis.call('ZADD','symbol.'..ARGV[1]..'.'..ARGV[2],tradeId,trade)            -- store a copy of the trade in a sorted set

return {tradeId,ARGV[2],newAmount,newQuantity,newAmount/newQuantity}