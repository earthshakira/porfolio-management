local u = 'user.'..ARGV[1]

local un = redis.call('GET',u)
if un then
    return redis.error_reply('User Already Exists')
end

redis.call('SET',u,ARGV[2])  -- store user attributes
redis.call('SET','auth.'..ARGV[2],'1')  -- store basicauth
return {ARGV[1]}