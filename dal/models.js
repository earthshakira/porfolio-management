/**
 * Creates models for transer of data and act as an abstraction layer for Business Logic
 * @module Models
 */

const { ReplyError } = require('redis');
const backend = require('./backend')

const MAGIC_RETURNS_PRICE = 100

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
     * The order method executes an order for this constructor, it internally 
     * uses 2 separate calls depending on wether the trade was a `BUY` or `SELL`
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

    /**
     * Given a TradeId it gives all the fields of trade to the backend, 
     * for this method the fields are optional and supports any combination 
     * of missing fields, it's strongly consistent and atomic and will raise
     * errors on bad updates.
     * @param {number} tradeId 
     */
    async update(tradeId) {
        let r = await backend.updateSecurity(tradeId,this.user,this.symbol,this.price * 100 || this.price,this.shares,this.type)
        r.totalCost = (r.totalCost/100).toFixed(2)
        r.averagePrice = (r.averagePrice/100).toFixed(2)
        return r
    }

    /**
     * Delete's a trade given it's concistent, it uses the same script of update
     * and is anologus to updating the trades value to (BUY,0 stocks for 0 price)
     * @param {number} tradeId 
     */
    async delete(tradeId) {
        let r = await backend.updateSecurity(tradeId,this.user,this.symbol,this.price * 100 || this.price,this.shares,this.type,1)
        r.totalCost = (r.totalCost/100).toFixed(2)
        r.averagePrice = (r.averagePrice/100).toFixed(2)
        return r
    }
}

/**
 * This class is used to manage the fetching of symbol wise trades for a user
 * @export @final
 */
exports.TradeList = class {
    /**
     * @param  {string} user
     */
     constructor(user){
        this.user = user
    }

    /** Gets the list of for the current user and groups them by symbol */
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


/**
 * It fetches the portfolio of a user and returns 
 * @export @final
 */
exports.Portfolio = class {

    /**
     * @param  {string} user 
     */
    constructor(user){
        this.user = user
    }

    /** Gets the portfolio for all the symbols traded by the user */
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

    /** Uses the portfolio data and calculates the cumulative returns over all the stocks */
    async getReturns() {
        let portfolioData = await this.get()
        let returns = 0
        portfolioData.forEach(item => {
            returns += (MAGIC_RETURNS_PRICE - parseFloat(item.price)) * item.shares
        })
        returns = returns.toFixed(2)
        return {returns}
    }
}