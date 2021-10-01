/**
 * @module TradeEndpoints
 */
const express = require('express');
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

router.get('/', async function(req, res) {
  let tl = new models.TradeList(req.auth.user)
  res.json(await tl.get())
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

router.put('/:tradeId/', async function(req, res, next) {
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
        let resp = await trade.update(req.params.tradeId)
        res.json(resp)
    } catch(error) {
        res.status(400);
        res.json([error.toString()])
    }
});

router.patch('/:tradeId/', async function(req, res, next) {
    let payload = req.body
    let {tradeType,tickerSymbol,price,quantity} = payload;
    let errors = []

    if ('tradeType' in payload){
        errors.push(validateTradeType(payload))
    }
    if ('price' in payload){
        errors.push(validatePrice(payload))
    }
    if ('quantity' in payload){
        errors.push(validateQuantity(payload))
    }

    if (errors.length) {
        res.status(400)
        res.json(errors)
        return
    }
    

    
    try {
        if (tradeType)
            tradeType == 'BUY' ? 'B' : 'S'
        let trade = new models.Trade(req.auth.user,tradeType,tickerSymbol,price,quantity)
        let resp = await trade.update(req.params.tradeId)
        res.json(resp)
    } catch(error) {
        res.status(400);
        res.json([error.toString()])
    }
});

router.delete('/:tradeId/', async function(req, res, next) {
    try {
        let trade = new models.Trade(req.auth.user)
        let resp = await trade.delete(req.params.tradeId)
        res.status(204)
        res.json(resp)
    } catch(error) {
        res.status(400);
        res.json([error.toString()])
    }
});

module.exports = router;
