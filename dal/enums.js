/**
 * Enums required to make handling constants much easier.
 * @module Enums
 * 
 */

/** 
 * Enum for types of *Trade Transactions*
 * @readonly
 * @enum {string}
*/
const _TradeType = {
    /** This means the trade is a Buy Operation */
    BUY: 'B',
    /** This means the trade is a Sell Operation */
    SELL: 'S'
};
export { _TradeType as TradeType };

/** 
 * Enum for types of updates for a Trade in Changelog.
 * These types will be used to denote what has changed 
 * in a particular trade entry.
 * @readonly
 * @enum {string}
*/
const _ChangeType = {
    /** trade happened for the _first time_ */
    CREATE: 'C',
    /**  trade is _deleted_ */
    DELETE: 'D',
    /** Trade the values in a trade are being modified */
    VALUE: 'V',
    /** denotes a SELL Trade has been updated to a SELL*/
    UPDATE_TO_BUY: 'S',
    /** denotes a BUY Trade has been updated to a SELL */
    UPDATE_TO_SELL: 'B',
};
export { _ChangeType as ChangeType };
