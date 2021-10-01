--[=====[
    The selling script with rollback for negative quantity of shares in portfolio

    Arguments:
    ARGV[1] = username
    ARGV[2] = tickerSymbol
    ARGV[3] = price
    ARGV[4] = quantity
    ARGV[5] = tradeId
    ARGV[6] = tradeType
    ARGV[7] = isDelete

    We define 2 types of updates 
     - major updates :
        When the tradeType or tradeSymbol changes, then undo of the
        previous operations is necessary for the update to be concistent
     - minor updates :
        only quantity or price changes 
--]=====]

local portfolio = 'portfolio.'..ARGV[1]

local tradeId = ARGV[5]
local isDelete = ARGV[7]
local packedTrade = redis.call('HGET','trades.'..ARGV[1],tradeId)
if packedTrade == false then
    return redis.error_reply('Trade with id "'..tradeId..'"not found')
end

local ptradeId,oldTradeType,oldSymbol,oldAmount,oldQuantity = cmsgpack.unpack(packedTrade)
local oldPrice = oldAmount/oldQuantity
local newTradeType,newSymbol,newAmount,newQuantity = oldTradeType,oldSymbol,oldAmount,oldQuantity
local newPrice = oldPrice

-- [begin partial update] create new trade from partial fields
if ARGV[6] ~= '' then -- type was provided
    newTradeType = ARGV[6]
end

if ARGV[2] ~= '' then -- tickerSymbol was provided
    newSymbol = ARGV[2]
end

if ARGV[4] ~= '' then -- shares were provided
    newQuantity = tonumber(ARGV[4])
end

if ARGV[3] ~= '' then -- price was provided
    newPrice = tonumber(ARGV[3])
    newAmount = newPrice * newQuantity
 end

if oldTradeType == newTradeType and 
    oldSymbol == newSymbol and
    oldPrice == newPrice and
    oldQuantity == newQuantity and
    isDelete ~= '1' then
    return redis.error_reply("Unchanged")
    -- "Update is inconsistent"
end
-- [end partial update]
local rSymbol,rAmount,rQuantity = '',0,0
if oldSymbol == newSymbol then  -- update in a single security
    local tradeSet = 'symbol.'..ARGV[1]..'.'..oldSymbol
    local stateAmount,stateQuantity = 0,0
    local tradeList  = redis.call('ZRANGEBYSCORE',tradeSet,0,100000)
    
    for i,t in pairs(tradeList) do
        local ntradeId,nTradeType,nSymbol,nAmount,nQuantity = cmsgpack.unpack(t)
        if ntradeId == ptradeId then
            if isDelete == '1' then -- handle as a delete
                nQuantity = 0
                nAmount = 0
            else
                ntradeId,nTradeType,nSymbol,nAmount,nQuantity = ptradeId,newTradeType,newSymbol,newAmount,newQuantity
            end
        end
        if nTradeType == "B" then -- process a buy trade
            stateAmount = stateAmount + nAmount
            stateQuantity = stateQuantity + nQuantity
        else                      -- process a sell trade
            if stateQuantity == 0 then
                return redis.error_reply("Update is inconsistent")
            end
            local avg = stateAmount/stateQuantity
            stateQuantity = stateQuantity - nQuantity
            stateAmount = stateAmount - nQuantity * avg
        end
        if stateQuantity < 0 then
            return redis.error_reply("Update is inconsistent")
        end
        if stateQuantity == 0 then 
            stateAmount = 0
        end
    end
    rSymbol = oldSymbol
    rAmount = stateAmount
    rQuantity = stateQuantity

    local trade =  cmsgpack.pack(ptradeId,newTradeType,newSymbol,newAmount,newQuantity)
    redis.call('ZREMRANGEBYSCORE','symbol.'..ARGV[1]..ARGV[2],ptradeId,ptradeId)
    if isDelete == '1' then
        redis.call('HDEL','trades.'..ARGV[1],tradeId)
    else
        redis.call('HSET','trades.'..ARGV[1],tradeId,trade)
        redis.call('ZADD','symbol.'..ARGV[1]..'.'..ARGV[2],ptradeId,trade)
    end
    local av = 0
    if stateQuantity ~= 0 then
        av = stateAmount/stateQuantity
    end
    redis.call('HSET',portfolio,newSymbol..'.p',stateAmount,newSymbol..'.q',stateQuantity,newSymbol..'.a',av)
else    -- Symbol has changed so we perform a delete type operation and add operation
    local tradeSet = 'symbol.'..ARGV[1]..'.'..oldSymbol
    local stateAmount,stateQuantity = 0,0
    local tradeList  = redis.call('ZRANGEBYSCORE',tradeSet,0,100000)
    
    for i,t in pairs(tradeList) do
        local ntradeId,nTradeType,nSymbol,nAmount,nQuantity = cmsgpack.unpack(t)
        if ntradeId == ptradeId then
                nQuantity = 0
                nAmount = 0
        end
        if nTradeType == "B" then -- process a buy trade
            stateAmount = stateAmount + nAmount
            stateQuantity = stateQuantity + nQuantity
        else                      -- process a sell trade
            if stateQuantity == 0 then 
                return redis.error_reply("Update is inconsistent")
            end
            local avg = stateAmount/stateQuantity
            stateQuantity = stateQuantity - nQuantity
            stateAmount = stateAmount - nQuantity * avg
        end
        if stateQuantity < 0 then
            return redis.error_reply("Update is inconsistent")
        end
        if stateQuantity == 0 then 
            stateAmount = 0
        end
    end

    local btradeSet = 'symbol.'..ARGV[1]..'.'..newSymbol
    local bstateAmount,bstateQuantity = 0,0
    local btradeList  = redis.call('ZRANGEBYSCORE',btradeSet,0,100000)
    
    local first = 1
    table.insert(btradeList,cmsgpack.pack(1000000,'B','dummy',0,0))
    for i,t in pairs(btradeList) do
        local ntradeId,nTradeType,nSymbol,nAmount,nQuantity = cmsgpack.unpack(t)
        if ntradeId > ptradeId and first == 1 then
            first = 0
            if nTradeType == "B" then -- process a buy trade
                bstateAmount = bstateAmount + newAmount
                bstateQuantity = bstateQuantity + newQuantity
            else                      -- process a sell trade
                if bstateQuantity == 0 then 
                    return redis.error_reply("Update is inconsistent")
                end
                local avg = bstateAmount/bstateQuantity
                bstateQuantity = bstateQuantity - newQuantity
                bstateAmount = bstateAmount - newQuantity * avg
            end
            if bstateQuantity < 0 then
                return redis.error_reply("Update is inconsistent")
            end
            if bstateQuantity == 0 then 
                bstateAmount = 0
            end
        end
        if nTradeType == "B" then -- process a buy trade
            bstateAmount = bstateAmount + nAmount
            bstateQuantity = bstateQuantity + nQuantity
        else                      -- process a sell trade
            if bstateQuantity == 0 then 
                return redis.error_reply("Update is inconsistent")
            end
            local avg = bstateAmount/bstateQuantity
            bstateQuantity = bstateQuantity - nQuantity
            bstateAmount = bstateAmount - nQuantity * avg
        end
        if bstateQuantity < 0 then
            return redis.error_reply("Update is inconsistent")
        end
        if bstateQuantity == 0 then 
            bstateAmount = 0
        end
    end


    rSymbol = newSymbol
    rAmount = bstateAmount
    rQuantity = bstateQuantity

    
    redis.call('ZREMRANGEBYSCORE','symbol.'..ARGV[1]..ARGV[2],ptradeId,ptradeId)
    redis.call('HDEL','trades.'..ARGV[1],tradeId)
    redis.call('HSET',portfolio,oldSymbol..'.p',stateAmount,oldSymbol..'.q',stateQuantity,oldSymbol..'.a',stateAmount/stateQuantity)
    
    local trade =  cmsgpack.pack(ptradeId,newTradeType,newSymbol,newAmount,newQuantity)
    redis.call('HSET','trades.'..ARGV[1],tradeId,trade)
    redis.call('ZADD','symbol.'..ARGV[1]..'.'..ARGV[2],ptradeId,trade)
    redis.call('HSET',portfolio,newSymbol..'.p',bstateAmount,newSymbol..'.q',bstateQuantity,newSymbol..'.a',bstateAmount/bstateQuantity)
end

local av = 0
if rQuantity > 0 then
    av = rAmount/rQuantity
end

return {ptradeId,rSymbol,rAmount,rQuantity,av}