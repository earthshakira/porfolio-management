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

test('SingleSymbolPortfolio',async () => {
    let trade = new Trade('SingleSymbolPortfolio','B','A',10,10).order() // amount,price,quantity = 100,10,10
    trade = new Trade('SingleSymbolPortfolio','B','A',20,10).order()     // amount,price,quantity = 300,15,20
    trade = new Trade('SingleSymbolPortfolio','S','A',25,10).order()     // amount,price,quantity = 150,15,10
    

    let tl = new Portfolio('SingleSymbolPortfolio')
    let portfolio = await tl.get()
    console.log(portfolio)
    expect(portfolio).toEqual([
        {"amount": "150.00", "price": "15.00", "shares": 10, "tickerSymbol": "A"}
    ])
})

test('SimplePortfolio',async () => {
    let trade = new Trade('SimplePortfolio','B','A',10,10).order() // A amount,price,quantity = 100,10,10
    trade = new Trade('SimplePortfolio','B','A',20,10).order()     // A amount,price,quantity = 300,15,20
    trade = new Trade('SimplePortfolio','B','B',20,10).order()     // B amount,price,quantity = 200,20,10
    trade = new Trade('SimplePortfolio','S','A',25,10).order()     // A amount,price,quantity = 150,15,10
    trade = new Trade('SimplePortfolio','B','B',10,10).order()     // B amount,price,quantity = 300,15,20
    trade = new Trade('SimplePortfolio','S','B',25,10).order()     // B amount,price,quantity = 150,15,10

    let tl = new Portfolio('SimplePortfolio')
    expect(await tl.get()).toEqual([
        {"amount": "150.00", "price": "15.00", "shares": 10, "tickerSymbol": "A"},
        {"amount": "150.00", "price": "15.00", "shares": 10, "tickerSymbol": "B"}
    ])
})