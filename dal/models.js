/**
 * Creates models for transer of data and act as an abstraction layer for Business Logic
 * @module Models
 */

const { ReplyError } = require('redis');
const backend = require('./backend')

/**
 * The Trade class is used as a container for handing Trade related Operations
 * @export @final
 */
exports.Trade = class {
    /**
     * @param  {TradeType} type Type of the trade ('B'|'S')
     * @param  {string} symbol The ticker symol for this trade
     * @param  {number} price The average amount per share for the trade
     * @param  {number} shares The number of shares traded
     */
    constructor(user,type,symbol,price,shares){
        this.user = user
        this.type = type;
        this.symbol = symbol
        this.price = price,
        this.shares = shares
        this.amount = price*shares*100
    }
    /**
     * The order method executes an order
     */
    async order() {
        let res = null
        try {
            if (this.type == 'B')
                res = await backend.buySecurity(this.user,this.symbol,this.amount,this.shares);
            else
                res = await backend.sellSecurity(this.user,this.symbol,this.amount,this.shares);
          } catch (error) {
            if (error == new ReplyError('Sell Not Possible for Symbol')){
                throw EvalError("Improper Sell")
            }
          }
        return res   
    }
}

exports.Portfolio = class {
    constructor(user){

    }
}