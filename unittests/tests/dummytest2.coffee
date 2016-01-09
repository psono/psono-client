describe 'A suite', ->
  it 'contains spec with an expectation', ->
    expect(true).toBe true


describe 'Fist suite', ->

  beforeEach(module('angularjsDE'))

  it 'angular module should exist', inject (passwordManagerApp) ->
    expect(cryptoLibrary).toBeDefined()
