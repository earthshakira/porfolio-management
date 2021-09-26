/**
 * Creates models for transer of data and act as an abstraction layer for Business Logic
 * @module Models
 * 
 */

/**
 * The Trade class is used as a container for handing Trade related Operations
 * @export @final
 */
export class Trade {
    /**
     * @param  {TradeType} type Type of the trade ('B'|'S')
     * @param  {string} symbol The ticker symol for this trade
     * @param  {number} price The average amount per share for the trade
     * @param  {number} shares The number of shares traded
     */
    constructor(type,symbol,price,shares){
        this.type = type;
        this.symbol = symbol
        this.price = price,
        this.shares = shares
        this.amount = price*shares*100
    }
}

export class ChangeLog extends Trade {
    constructor(user_id,symbol,price,stocks){

    }
}

export class Portfolio {
    constructor(user){

    }
}