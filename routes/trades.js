/**
 * @module TradeEndpoints
 */
const express = require('express');
const backend = require('../dal/backend');
const models = require('../dal/models');

/**
 * The trade router which handles the requests for creating, updating and listing trades
 */
const router = express.Router();


let validateTradeType = (payload) => {
    if (payload.tradeType != "BUY" && payload.tradeType != "SELL") {
        return [`Incorrect 'tradeType' can only be BUY or SELL got '${payload.tradeType}'`]
    } 
    return []
}

let validateQuantity = (payload) => {
    if (!(payload.quantity > 0 && parseInt(payload.quantity) == payload.quantity))
        return [`'quantity' must be a positive integer got '${payload.quantity}'`]
    return []
}

let validatePrice = (payload) => {
    if (!(payload.price > 0 && parseInt(payload.price*100) == payload.price * 100))
        return [`'price' must be a positive float with atmost 2 decimals got '${payload.price}'`]
    return []
}


/**
 * We validate the payload to ensure input it check the conditions
 *  1. Required Fields are present
 *  2. All values are non negative and in proper precision
 * 
 * @param  {object} payload - input from the client in `req.body`
 */
let validateTradePayload = (payload) => {
    let requiredFields = ["tradeType","quantity","price","tickerSymbol"]
    let errors = []
    for(let field of requiredFields)
        if (!(field in payload))
            errors.push(`'${field}' required but not found`)

    errors.push(...validateTradeType(payload))
    errors.push(...validateQuantity(payload))
    errors.push(...validatePrice(payload))
    
    return errors
}

router.get('/', function(req, res) {
  console.log("req",req.body)
  res.json(req.body)
});


router.post('/', async function(req, res) {
    let payload = req.body
    let type = 'B'
    let errors = validateTradePayload(payload)
    if (errors.length) {
        res.status(400)
        res.json(errors)
        return
    }
    try {
        let {tradeType,tickerSymbol,price,quantity} = payload;
        let trade = new models.Trade(req.auth.user,tradeType == 'BUY' ? 'B' : 'S',tickerSymbol,price,quantity)
        let resp = await trade.order()
        res.json(resp)
    } catch(error) {
        res.status(400);
        res.json([error.toString()])
    }
    
});

router.put('/:tradeId/', function(req, res, next) {
    console.log("req",req.body)
    res.json(req.body);
});

router.delete('/:tradeId/', function(req, res, next) {
    console.log("req",req.body)
    res.json(req.body);
});

module.exports = router;
