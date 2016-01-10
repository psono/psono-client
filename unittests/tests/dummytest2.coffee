describe 'A suite', ->
  it 'contains spec with an expectation', ->
    expect(true).toBe true


describe 'cryptoLibrary suite', ->
  beforeEach(module('passwordManagerApp'))
  it 'cryptoLibrary should exist', inject (cryptoLibrary) ->
    expect(cryptoLibrary).toBeDefined()

