/**
 * Creates models for transer of data and act as an abstraction layer for Business Logic
 * @module Models
 * 
 */


/** 
 * Enum to handle the Type of Trade
*/
module.exports.TradeType = {
    BUY: 'B',
    SELL: 'S'
}

module.exports.Trade = class Trade {
    constructor(symbol,price,stocks){

    }
}