--[=====[
    The selling script with rollback for negative quantity of shares in portfolio

    Arguments
    ARGV[1] = username
    ARGV[2] = tickerSymbol
    ARGV[3] = amount [price * shares]
    ARGV[4] = shares
--]=====]

local portfolio = 'portfolio.'..ARGV[1]
local tradeId = redis.call('INCR','tradeId.'..ARGV[1])

local amount = tonumber(ARGV[3])
local quantity = tonumber(ARGV[4])

local newQuantity = redis.call('HINCRBY',portfolio,ARGV[2]..'.q',-1 * quantity)      -- decrease the total quantity of the shares
if newQuantity < 0 then
    redis.call('HINCRBY',portfolio,ARGV[2]..'.q',quantity)                           -- rollback quantity on failure
    return redis.error_reply('Sell Not Possible for Symbol')
end
local avgPrice = redis.call('HGET',portfolio,ARGV[2]..'.a')


local newAmount = redis.call('HINCRBY',portfolio,ARGV[2]..'.p',-1 * quantity*avgPrice)     -- decrease the total price to match that of remainder shares
if newQuantity == 0 then 
    redis.call('HSET',portfolio,ARGV[2]..'.a',0)
    avgPrice = 0
end

local trade =  cmsgpack.pack(tradeId,'S',ARGV[2],amount,quantity)
redis.call('HSET','trades.'..ARGV[1],tradeId,trade)           -- store a copy of the trade
redis.call('ZADD','symbol.'..ARGV[1]..'.'..ARGV[2],tradeId,trade)  -- store a copy of the trade in a sorted set

return {tradeId,ARGV[2],newAmount,newQuantity,avgPrice}