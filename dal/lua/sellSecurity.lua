local portfolio = 'portfolio.'..ARGV[1]
local tradeId = redis.call('INCR','tradeId.'..ARGV[1])

local totalAmount = tonumber(ARGV[3])
local totalQuantity = tonumber(ARGV[4]) * -1

local newQuantity = redis.call('HINCRBY',portfolio,ARGV[2]..'.q',totalQuantity)      -- decrease the total quantity of the shares
if newQuantity < 0 then
    redis.call('HINCRBY',portfolio,ARGV[2]..'.q',-1*totalQuantity)
    return redis.error_reply('Sell Not Possible for Symbol')
end

local avgPrice = redis.call('HGET',portfolio,ARGV[2]..'.a')
totalAmount = redis.call('HINCRBY',portfolio,ARGV[2]..'.p',totalQuantity*avgPrice)     -- decrease the total price to match that of remainder shares

local trade =  cmsgpack.pack('S',ARGV[2],totalAmount,-1*totalQuantity)

redis.call('HSET','trades.'..ARGV[1],tradeId,ARGV[2])  -- store a copy of the trade
return {ARGV[2],totalAmount,totalQuantity}