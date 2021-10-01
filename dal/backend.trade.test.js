const { expect } = require('@jest/globals');
const { ReplyError } = require('redis');
const { async } = require('regenerator-runtime');
const backend = require('./backend')
const {Trade, TradeList} = require('./models')

beforeAll(async() => {
    await backend.init()
    await backend.reset()
});

afterAll(backend.close);

test('Buy Shares', async () => {
    let trade = new Trade('test','B','TCS',100.50,10)
    let order = await trade.order()
    expect(order.averagePrice).toBe('100.50')
    expect(order.totalShares).toBe(10)
    expect(order.totalCost).toBe('1005.00')
})

test('Sell Shares', async () => {

    let trade = new Trade('test','B','ITC',100.50,10)
    let order = await trade.order()

    trade = new Trade('test','S','ITC',100.50,10)
    order = await trade.order()
    expect(order.averagePrice).toBe('0.00')
    expect(order.totalShares).toBe(0)
    expect(order.totalCost).toBe("0.00")
    console.log(order)
})

test('Invalid Sell', async () => {
    let trade = new Trade('test','B','ZOMATO',100.50,10)
    let order = await trade.order()

    trade = new Trade('test','S','ZOMATO',100.50,11)
    order = trade.order()
    expect(order).rejects.toEqual(new ReplyError("Sell Not Possible for Symbol"))
})

test('Update Buy Trade[quantity] = 10 -> 8',async () => {
    let trade = new Trade('test','B','MINORUPDATE',100.50,10)
    let order = await trade.order()
    console.log(order)
    let tradeUpdate = new Trade('test','B','MINORUPDATE',100.50,8)
    order = await tradeUpdate.update(order.tradeId)
    expect(order.averagePrice).toBe('100.50')
    expect(order.totalShares).toBe(8)
    expect(order.totalCost).toBe("804.00")
})

test('Update Buy Trade[quantity] = 10 -> 8, after sell 9',async () => {
    let trade = new Trade('test','B','S-ERROR',100.50,10)
    let order = await trade.order()
    console.log(order)
    let strade = new Trade('test','S','S-ERROR',100.50,9)
    let sorder = await strade.order()
    console.log(order)
    let btrade = new Trade('test','B','S-ERROR',100.50,10)
    let border = await btrade.order()
    console.log(order)
    let tradeUpdate = new Trade('test','B','S-ERROR',100.50,8)
    order = tradeUpdate.update(order.tradeId)
    expect(order).rejects.toEqual(new ReplyError("Update is inconsistent"))
})

test('Update Buy Trade[quantity] = 10 -> 20, after sell 9',async () => {
    let trade = new Trade('test','B','B-20-FINE',100.50,10)
    let order = await trade.order()
    console.log(order)
    let strade = new Trade('test','S','B-20-FINE',100.50,9)
    let sorder = await strade.order()
    console.log(order)
    let btrade = new Trade('test','B','B-20-FINE',100.50,10)
    let border = await btrade.order()
    console.log(order)
    let tradeUpdate = new Trade('test','B','B-20-FINE',100.50,20)
    order = await tradeUpdate.update(order.tradeId)
    console.log(order)
    // expect(order).rejects.toEqual(new ReplyError("Update is inconsistent"))
})

test('Update Change Symbol',async () => {
    let trade = new Trade('test','B','symbA',100.50,10)
    let order = await trade.order()
    console.log(order)
    let tradeUpdate = new Trade('test','B','symbB',100.50,8)
    order = await tradeUpdate.update(order.tradeId)
    console.log(order)
    expect(order.averagePrice).toBe('100.50')
    expect(order.totalShares).toBe(8)
    expect(order.totalCost).toBe("804.00")
    // expect(order).rejects.toEqual(new ReplyError("Update is inconsistent"))
})


test('DeleteTrade',async () => {
    let trade = new Trade('test','B','delA',100.50,10)
    let order = await trade.order()
    console.log(order)
    let tradeUpdate = new Trade('test')
    order = await tradeUpdate.delete(order.tradeId)
    console.log("Delete Order",order)
    expect(order.averagePrice).toBe('0.00')
    expect(order.totalShares).toBe(0)
    expect(order.totalCost).toBe("0.00")
    // expect(order).rejects.toEqual(new ReplyError("Update is inconsistent"))
})


test('DeleteTrade Error',async () => {
    let trade = new Trade('test','B','delError',100.50,10)
    let order = await trade.order()
    console.log(order)

    let strade = new Trade('test','S','delError',100.50,6)
    let sorder = await strade.order()
    console.log(sorder)
    
    let tradeUpdate = new Trade('test')
    order = tradeUpdate.delete(order.tradeId)
    expect(order).rejects.toEqual(new ReplyError("Update is inconsistent"))
})

test('ListTrades',async () => {
    let trade = new Trade('listTradesTest','B','listA',100.50,10).order()
    trade = new Trade('listTradesTest','B','listB',10.50,10).order()
    trade = new Trade('listTradesTest','B','listA',100.50,10).order()
    trade = new Trade('listTradesTest','B','listC',100.50,10).order()
    trade = new Trade('listTradesTest','S','listA',100.50,10).order()


    let tl = new TradeList('listTradesTest')
    
    expect(await tl.get()).toEqual({
        listA: [
          {tradeId: 1,tradeType: 'BUY',symbol: 'listA',quantity: 10,price: '100.50'},
          {tradeId: 3,tradeType: 'BUY',symbol: 'listA',quantity: 10,price: '100.50'},
          {tradeId: 5,tradeType: 'SELL',symbol: 'listA',quantity: 10,price: '100.50'}
        ],
        listB: [{tradeId: 2,tradeType: 'BUY',symbol: 'listB',quantity: 10,price: '10.50'}],
        listC: [{tradeId: 4,tradeType: 'BUY',symbol: 'listC',quantity: 10,price: '100.50'}]
      })
})