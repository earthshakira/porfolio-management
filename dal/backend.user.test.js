const { expect } = require('@jest/globals');
const { ReplyError } = require('redis');
const { async } = require('regenerator-runtime');
const backend = require('./backend')
const {promisify} = require('util')

let asyncAuthorizer = promisify(backend.userAuthorizer).bind(backend)

beforeAll(async() => {
    backend.init()
    await backend.reset()
});

afterAll(backend.close);

test('Create User', async () => {
    await backend.createUser("test","test")
})

test('Duplicate User', async () => {
    let response = backend.createUser("test","test")
    expect(response).rejects.toEqual(new ReplyError("User Already Exists"));
})

test('User Authorization Success', async () => {
    
    let response = await asyncAuthorizer("test","test")
    expect(response).toBe(true)
})

test('User Authorization Failing', async () => {
    let response = await asyncAuthorizer("test","test2")
    expect(response).toBe(false)
})