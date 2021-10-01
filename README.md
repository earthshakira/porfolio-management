# Portfolio Management

## Important Links

 - [Github Repo](https://github.com/earthshakira/portfolio-management)
 - [CI Testing Report](https://earthshakira.github.io/portfolio-management/jest_html_reporters.html)   
 - [Heroku Swagger Client](https://shubham-ar-portfolio-mgmt.herokuapp.com/swagger/) 

## Online Demo      

1. Go to [Heroku Swagger Client](https://shubham-ar-portfolio-mgmt.herokuapp.com/swagger/)  
2. Use the `POST /user` endpoint and create a user for your self or use the test user credentials
    - Test user
        - username: test
        - password: test
3. Use the `AUTHORIZE` button on the top right to to log yourself in
4. Now you can use all the other endpoints
5. Swagger gives a  `Try it Out` button for all the endpoints where you can create a post body and make requests.

## Running it Locally

#### Start Redis
```bash
docker run --name some-redis -p6379:6379 -d redis:6.2.5 redis-server --appendonly yes
```

#### Start the App
```
npm install --also=dev
npm start
```

## API Design
![System Overview](https://i.imgur.com/FWXLZ14.png)

 - __Swagger__ is the api documentation and acts like a makeshift ui for us allowing us to make requests to our app
 - __Nodejs__ performs the following tasks:
    - User Management with BasicAuth
    - Request Validation 
    - Acts as a Data Abstraction Layer
 - __Redis__ is our data backend
    - Persists Data to disk
    - Uses [Lua Scripts](https://earthshakira.github.io/portfolio-management/module-LuaScripts.html) to make all Trade Ops *Atomic*
    - Gives superfast data access with *HashMaps*, *SortedSets* and *Counters*

### ER Diagram
![ER Diagram](https://i.imgur.com/ztceaZJ.png)

### Redis Schema
The table shows the keys and how they are stored in the redis instance


| Keys(+Fields)                           | Type   | Value                 | Description         |
| --------------------------------------- | ------ | -------------------------- | ------------------- |
| `auth.{username}:{password}`            | String | 1                     | Used for verifying Basic Auth |
| `user.{username}`                       | String | `{username}:{password}` | Used to check if user already exists |
| `portfolio.{username} => {symbol}.{op}` | HashMap| Integer               | Stores the portfolio for a symbol `op` = `{p,q,a}` => `{totalPrice,quantity,average}` ,p and q are counters and stores all values are in fixed point representation|
| `tradeId.{username}`                    | Counter| Integer                | Monotonically increasing integer to get the `tradeId` for a new trade |
| `trades.{username} => {tradeId}`        | HashMap|  `tradeObj` | stores the list of trades of a user |
| `symbol.{username}.{symbol}`            | SortedSet| score = `tradeId`,value = `tradeObj` | this is used to store the list of trades and is extremely useful to recalculate portfolios on updates |
 
*Note: Here `tradeObj` is the `MsgPack` encoded object of a trade, where `trade = {tradeId,tradeType,symbol,quantity,price}`*

