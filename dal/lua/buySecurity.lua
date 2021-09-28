local portfolio = 'portfolio.'..ARGV[1]
local tradeId = redis.call('INCR','tradeId.'..ARGV[1])

local totalAmount = tonumber(ARGV[3])
local totalQuantity = tonumber(ARGV[4])

totalAmount = redis.call('HINCRBY',portfolio,ARGV[2]..'.p',totalAmount)          -- increase the total price of the bought shares
totalQuantity = redis.call('HINCRBY',portfolio,ARGV[2]..'.q',totalQuantity)      -- increase the total quantity of the shares
redis.call('HSET',portfolio,ARGV[2]..'.a',totalAmount/totalQuantity)             -- calculate the pershare average for the shares

local trade =  cmsgpack.pack('B',ARGV[2],totalAmount,totalQuantity)     -- generate a packed version of the trade
redis.call('HSET','trades.'..ARGV[1],tradeId,trade)                     -- store a copy of the trade

return {tradeId,ARGV[2],totalAmount,totalQuantity,totalAmount/totalQuantity}