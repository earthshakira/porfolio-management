--[=====[
    Get all trades for a user

    Arguments:
    ARGV[1] = username

--]=====]

local tradesKey = 'trades.'..ARGV[1]
local tradeList  = redis.call('HGETALL',tradesKey)
local unpackedTrades = {}
for i,t in pairs(tradeList) do
    if i%2 == 0 then
        table.insert(unpackedTrades,{cmsgpack.unpack(t)})
    end
end

return unpackedTrades