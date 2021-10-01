const { expect } = require('@jest/globals');
const { ReplyError } = require('redis');
const { async } = require('regenerator-runtime');
const backend = require('./backend')
const {Trade, Portfolio} = require('./models')

beforeAll(async() => {
    backend.init()
    await backend.reset()
});

afterAll(backend.close);

test('Portfolio:SingleSymbol',async () => {
    let trade = await new Trade('SingleSymbolPortfolio','B','A',10,10).order() // amount,price,quantity = 100,10,10
    trade = await new Trade('SingleSymbolPortfolio','B','A',20,10).order()     // amount,price,quantity = 300,15,20
    trade = await new Trade('SingleSymbolPortfolio','S','A',25,10).order()     // amount,price,quantity = 150,15,10
    

    let tl = new Portfolio('SingleSymbolPortfolio')
    let portfolio = await tl.get()

    expect(portfolio).toEqual([
        {"amount": "150.00", "price": "15.00", "shares": 10, "tickerSymbol": "A"}
    ])
    let {returns} = await tl.getReturns()
})

test('Portfolio:TwoSymbols',async () => {
    let trade = await new Trade('TwoSymbolPortfolio','B','A',10,10).order() // A amount,price,quantity = 100,10,10
    trade = await new Trade('TwoSymbolPortfolio','B','A',20,10).order()     // A amount,price,quantity = 300,15,20
    trade = await new Trade('TwoSymbolPortfolio','B','B',20,10).order()     // B amount,price,quantity = 200,20,10
    trade = await new Trade('TwoSymbolPortfolio','S','A',25,10).order()     // A amount,price,quantity = 150,15,10
    trade = await new Trade('TwoSymbolPortfolio','B','B',10,10).order()     // B amount,price,quantity = 300,15,20
    trade = await new Trade('TwoSymbolPortfolio','S','B',25,10).order()     // B amount,price,quantity = 150,15,10

    let tl = new Portfolio('TwoSymbolPortfolio')
    expect(await tl.get()).toEqual([
        {"amount": "150.00", "price": "15.00", "shares": 10, "tickerSymbol": "A"},
        {"amount": "150.00", "price": "15.00", "shares": 10, "tickerSymbol": "B"}
    ])
    let {returns} = await tl.getReturns()
    expect(returns).toBe("1700.00")
})

test('Portfolio:UpdateOldBuyTrade:Shares=10->20',async () => {
    let trade = await new Trade('UpdateOldBuyTradePortfolio','B','ZOMATO',240,10).order()
    let {tradeId} = trade
    trade = await new Trade('UpdateOldBuyTradePortfolio','B','CAMS100',384,9).order()
    trade = await new Trade('UpdateOldBuyTradePortfolio','S','ZOMATO',300,5).order()
    trade = await new Trade('UpdateOldBuyTradePortfolio','B','ICICI',1221,98).order()
    trade = await new Trade('UpdateOldBuyTradePortfolio','B','TCS',150,10).order()
    trade = await new Trade('UpdateOldBuyTradePortfolio','S','ZOMATO',350,5).order()
    trade = await new Trade('UpdateOldBuyTradePortfolio','B','MON100',28,34).order()
    await new Trade('UpdateOldBuyTradePortfolio',undefined,undefined,undefined,20).update(tradeId)
    let tl = new Portfolio('UpdateOldBuyTradePortfolio')
    let portfolio = await tl.get()

    expect(portfolio).toEqual([
        {tickerSymbol: 'CAMS100',amount: '3456.00',shares: 9,price: '384.00'},
        {tickerSymbol: 'ICICI',amount: '119658.00',shares: 98,price: '1221.00'},
        {tickerSymbol: 'MON100',amount: '952.00',shares: 34,price: '28.00'},
        {tickerSymbol: 'TCS',amount: '1500.00',shares: 10,price: '150.00'},
        {tickerSymbol: 'ZOMATO', amount: '2400.00', shares: 10, price: '240.00'}
    ])
    let {returns} = await tl.getReturns()
    expect(returns).toBe("-111866.00")
})

test('Portfolio:UpdateOldSellTrade:Shares=5->1',async () => {
    let trade = await new Trade('UpdateOldSellTradePortfolio','B','ZOMATO',240,10).order()
    
    trade = await new Trade('UpdateOldSellTradePortfolio','B','CAMS100',384,9).order()
    trade = await new Trade('UpdateOldSellTradePortfolio','S','ZOMATO',300,5).order()
    let {tradeId} = trade
    trade = await new Trade('UpdateOldSellTradePortfolio','B','ICICI',1221,98).order()
    trade = await new Trade('UpdateOldSellTradePortfolio','B','TCS',150,10).order()
    trade = await new Trade('UpdateOldSellTradePortfolio','S','ZOMATO',350,5).order()
    trade = await new Trade('UpdateOldSellTradePortfolio','B','MON100',28,34).order()
    await new Trade('UpdateOldSellTradePortfolio',undefined,undefined,undefined,1).update(tradeId)
    let tl = new Portfolio('UpdateOldSellTradePortfolio')
    let portfolio = await tl.get()

    expect(portfolio).toEqual([
        {tickerSymbol: 'CAMS100',amount: '3456.00',shares: 9,price: '384.00'},
        {tickerSymbol: 'ICICI',amount: '119658.00',shares: 98,price: '1221.00'},
        {tickerSymbol: 'MON100',amount: '952.00',shares: 34,price: '28.00'},
        {tickerSymbol: 'TCS',amount: '1500.00',shares: 10,price: '150.00'},
        {tickerSymbol: 'ZOMATO', amount: '960.00', shares: 4, price: '240.00'}
    ])
    let {returns} = await tl.getReturns()
    expect(returns).toBe("-111026.00")
})

test('Portfolio:UpdateOldSellTradeWithLaterBuys:Quantity=10->1',async () => {
    let trade = await new Trade('UpdateWithLaterBuy','B','B',20,10).order()     // B amount,price,quantity = 200,20,10
    trade = await new Trade('UpdateWithLaterBuy','S','B',20,10).order()     // B amount,price,quantity = 0,0,0
    let {tradeId} = trade
    trade = await new Trade('UpdateWithLaterBuy','B','B',10,10).order()     // B amount,price,quantity = 100,10,10
    trade = await new Trade('UpdateWithLaterBuy','S','B',25,10).order()     // B amount,price,quantity = 0,0,0
    await new Trade('UpdateWithLaterBuy',undefined,undefined,undefined,1).update(tradeId)
    let tl = new Portfolio('UpdateWithLaterBuy')
    expect(await tl.get()).toEqual([
        {"amount": "132.63", "price": "14.73", "shares": 9, "tickerSymbol": "B"}
    ])
    let {returns} = await tl.getReturns()
    expect(returns).toBe("767.43")
})

test('Portfolio:UpdateBuyTrade:Symbol=ZOMATO->TCS:Error',async () => {
    let trade = await new Trade('UpdateBuyTradePortfolio','B','ZOMATO',240,10).order()
    let {tradeId} = trade
    trade = await new Trade('UpdateBuyTradePortfolio','B','CAMS100',384,9).order()
    trade = await new Trade('UpdateBuyTradePortfolio','S','ZOMATO',300,5).order()
    trade = await new Trade('UpdateBuyTradePortfolio','B','ICICI',1221,98).order()
    trade = await new Trade('UpdateBuyTradePortfolio','B','TCS',150,10).order()
    trade = await new Trade('UpdateBuyTradePortfolio','S','ZOMATO',350,5).order()
    trade = await new Trade('UpdateBuyTradePortfolio','B','MON100',28,34).order()
    let errorUpdate = new Trade('UpdateBuyTradePortfolio',undefined,'TCS',undefined,undefined).update(tradeId)
    expect(errorUpdate).rejects.toEqual(new ReplyError("Update is inconsistent"))
    let tl = new Portfolio('UpdateBuyTradePortfolio')
    let portfolio = await tl.get()

    expect(portfolio).toEqual([
        {tickerSymbol: 'CAMS100',amount: '3456.00',shares: 9,price: '384.00'},
        {tickerSymbol: 'ICICI',amount: '119658.00',shares: 98,price: '1221.00'},
        {tickerSymbol: 'MON100',amount: '952.00',shares: 34,price: '28.00'},
        {tickerSymbol: 'TCS',amount: '1500.00',shares: 10,price: '150.00'},
        {tickerSymbol: 'ZOMATO', amount: '0.00', shares: 0, price: '0.00'}
    ])
    let {returns} = await tl.getReturns()
    expect(returns).toBe("-110466.00")
})

test('Portfolio:UpdateBuyTrade:Symbol=ICICI->TCS',async () => {
    let trade = await new Trade('UpdateBuyTrade2Portfolio','B','ZOMATO',240,10).order()
    trade = await new Trade('UpdateBuyTrade2Portfolio','B','CAMS100',384,9).order()
    trade = await new Trade('UpdateBuyTrade2Portfolio','S','ZOMATO',300,5).order()
    trade = await new Trade('UpdateBuyTrade2Portfolio','B','ICICI',1221,98).order()
    let {tradeId} = trade
    trade = await new Trade('UpdateBuyTrade2Portfolio','B','TCS',150,10).order()
    trade = await new Trade('UpdateBuyTrade2Portfolio','S','ZOMATO',350,5).order()
    trade = await new Trade('UpdateBuyTrade2Portfolio','B','MON100',28,34).order()
    
    let update = await new Trade('UpdateBuyTrade2Portfolio',undefined,'TCS',undefined,undefined).update(tradeId)

    let tl = new Portfolio('UpdateBuyTrade2Portfolio')
    let portfolio = await tl.get()

    expect(portfolio).toEqual([
        {tickerSymbol: 'CAMS100',amount: '3456.00',shares: 9,price: '384.00'},
        {tickerSymbol: 'ICICI',amount: '0.00',shares: 0,price: '0.00'},
        {tickerSymbol: 'MON100',amount: '952.00',shares: 34,price: '28.00'},
        {tickerSymbol: 'TCS',amount: '121158.00',shares: 108,price: '1121.83'},
        {tickerSymbol: 'ZOMATO', amount: '0.00', shares: 0, price: '0.00'}
    ])
    let {returns} = await tl.getReturns()
    expect(returns).toBe("-110465.64")
})

test('Portfolio:UpdateSellTrade:Symbol=ZOMATO->TCS',async () => {
    let trade = await new Trade('RebalancePortfolio','B','ZOMATO',240,10).order()
    trade = await new Trade('RebalancePortfolio','B','CAMS100',384,9).order()
    trade = await new Trade('RebalancePortfolio','S','ZOMATO',300,5).order()
    trade = await new Trade('RebalancePortfolio','B','ICICI',1221,98).order()
    trade = await new Trade('RebalancePortfolio','B','TCS',150,10).order()
    trade = await new Trade('RebalancePortfolio','S','ZOMATO',350,5).order()
    let {tradeId} = trade
    trade = await new Trade('RebalancePortfolio','B','MON100',28,34).order()
    await new Trade('RebalancePortfolio',undefined,'TCS',undefined,undefined).update(tradeId)
    let tl = new Portfolio('RebalancePortfolio')
    let portfolio = await tl.get()

    expect(portfolio).toEqual([
        {tickerSymbol: 'CAMS100',amount: '3456.00',shares: 9,price: '384.00'},
        {tickerSymbol: 'ICICI',amount: '119658.00',shares: 98,price: '1221.00'},
        {tickerSymbol: 'MON100',amount: '952.00',shares: 34,price: '28.00'},
        {tickerSymbol: 'TCS',amount: '750.00',shares: 5,price: '150.00'},
        {tickerSymbol: 'ZOMATO', amount: '1200.00', shares: 5, price: '240.00'}
    ])
    let {returns} = await tl.getReturns()
    expect(returns).toBe("-110916.00")
})