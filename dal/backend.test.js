const { expect } = require('@jest/globals');
const { ReplyError } = require('redis');
const { async } = require('regenerator-runtime');
const backend = require('./backend')

beforeAll(async() => {
    backend.init("t")
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
    let response = await backend.userAuthorizer("test","test")
    expect(response).toBe("1")
})

test('User Authorization Failing', async () => {
    let response = await backend.userAuthorizer("test","test2")
    expect(response).toBe(null)
})