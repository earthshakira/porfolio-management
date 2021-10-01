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
     * @param  {string} user user who did this trade
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
        /** Stores amount in the Fixed point representation */
        this.amount = price*shares*100
    }
    /**
     * The order method executes an order
     */
    async order() {
        let r = null
        if (this.type == 'B')
            r = await backend.buySecurity(this.user,this.symbol,this.amount,this.shares);
        else
            r = await backend.sellSecurity(this.user,this.symbol,this.amount,this.shares);
        
        r.totalCost = (r.totalCost/100).toFixed(2)
        r.averagePrice = (r.averagePrice/100).toFixed(2)
        return r
    }

    async update(tradeId) {
        let r = await backend.updateSecurity(tradeId,this.user,this.symbol,this.price * 100 || this.price,this.shares,this.type)
        r.totalCost = (r.totalCost/100).toFixed(2)
        r.averagePrice = (r.averagePrice/100).toFixed(2)
        return r
    }

    async delete(tradeId) {
        let r = await backend.updateSecurity(tradeId,this.user,this.symbol,this.price * 100 || this.price,this.shares,this.type,1)
        r.totalCost = (r.totalCost/100).toFixed(2)
        r.averagePrice = (r.averagePrice/100).toFixed(2)
        return r
    }
}


exports.TradeList = class {
    /**
     * @param  {string} user user who did this trade
     */
     constructor(user){
        this.user = user
    }

    async get() {
        let trades = await backend.getAllTrades(this.user)
        let tradesMap = {}
        trades.forEach(trade => {
            if(!tradesMap[trade.symbol]) {
                tradesMap[trade.symbol] = []
            }
            trade.tradeType = trade.tradeType === 'B' ? "BUY" : "SELL"
            trade.price = (trade.amount/trade.quantity/100).toFixed(2)
            delete trade.amount
            tradesMap[trade.symbol].push(trade)
        })
        
        return Object.entries(tradesMap).map(([k,v]) => {
            return {
                symbol: k,
                trades: v
            }
        })
    }
}
exports.Portfolio = class {
    constructor(user){
        this.user = user
    }

    async get() {
        let items = await backend.getPortfolio(this.user)
        items.forEach(trade => {
            trade.price = (trade.price/100).toFixed(2)
            trade.amount = (trade.amount/100).toFixed(2)
        })

        items.sort((a,b) => {
            if (a.tickerSymbol < b.tickerSymbol)
                return -1
            else if (a.tickerSymbol > b.tickerSymbol)
                return 1
            return 0
        })
        return items
    }
}