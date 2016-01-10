describe 'cryptoLibrary suite', ->
  beforeEach(module('passwordManagerApp'))

  it 'cryptoLibrary exists', inject (cryptoLibrary) ->
    expect(cryptoLibrary.randomBytes(16).length).toBe(16)
    expect(cryptoLibrary.randomBytes(32).length).toBe(32)
    expect(cryptoLibrary.randomBytes(64).length).toBe(64)

  it 'randomBytes returns the specified amount of bytes', inject (cryptoLibrary) ->
    expect(cryptoLibrary).toBeDefined()

  it "randomBytes doesn't return the the same in 1000 repetitions", inject (cryptoLibrary) ->
    numbers = 1000
    random_numbers = (cryptoLibrary.randomBytes(32) for num in [1..numbers])
    expect((new Set(random_numbers)).size).toBe(numbers)


  it 'to_hex returns real hex values', inject (cryptoLibrary) ->
    expect(cryptoLibrary.to_hex(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]))).toBe('000102030405060708090a0b0c0d0e0f')

  it 'from_hex returns the true Uint8Array', inject (cryptoLibrary) ->
    expect(cryptoLibrary.to_hex(cryptoLibrary.from_hex('000102030405060708090a0b0c0d0e0f'))).toBe('000102030405060708090a0b0c0d0e0f')

  it 'generate_authkey works', inject (cryptoLibrary) ->
    expect(cryptoLibrary.generate_authkey('test@example.com', '123456')).toBe('a871c77e2cf57f92bf845685c7ebd38aac25b15b1fd535d5c409c94e24e3ee74000976e05c63fef2a139bcf72e3bbad86fe3fcd9eee7346a9e94ac2123310450')
    expect(cryptoLibrary.generate_authkey('test2@example.com', '1234567')).toBe('17c28b8c5c0c0c5c90826aeb61d3c1150540e37967c07e4b56ef95d3d2005d52054ce43ac680382e1b5cbfb37c7eac4a257a99e3a3b39286a0b03fcddbba2d11')

  it 'generate_secret_key returns a 32 bytes long key', inject (cryptoLibrary) ->
    bytes = 32
    expect(cryptoLibrary.from_hex(cryptoLibrary.generate_secret_key()).length).toBe(bytes)

  it 'generate_public_private_keypair returns a pair of 32 bytes long keys', inject (cryptoLibrary) ->
    bytes = 32
    pair = cryptoLibrary.generate_public_private_keypair()
    expect(cryptoLibrary.from_hex(pair.private_key).length).toBe(bytes)
    expect(cryptoLibrary.from_hex(pair.public_key).length).toBe(bytes)

  it 'generate_public_private_keypair returned pairs are different', inject (cryptoLibrary) ->
    pair1 = cryptoLibrary.generate_public_private_keypair()
    pair2 = cryptoLibrary.generate_public_private_keypair()
    expect(pair1.private_key).toBe(pair1.private_key)
    expect(pair1.private_key).not.toBe(pair2.private_key)
    expect(pair1.public_key).not.toBe(pair2.public_key)

  it 'generate_user_sauce', inject (cryptoLibrary) ->
    bytes = 32
    user_sauce1 = cryptoLibrary.generate_user_sauce()
    user_sauce2 = cryptoLibrary.generate_user_sauce()

    expect(cryptoLibrary.from_hex(user_sauce1).length).toBe(bytes)
    expect(user_sauce1).not.toBe(user_sauce2)

  it 'decrypt_secret', inject (cryptoLibrary) ->
    data = '12345'
    password = 'myPassword'
    user_sauce = '6168de45af90c335967a8f9eae76f8f19bcb42fb8c3f602fee35f7617acdc489'
    nonce = '1f1bffb2aa506fd53913a81a3a04ce5e2d174d0421126a06'
    text = 'b96dc28175fe79bd394eaf6cc1ce041cea42b02be4'
    expect(cryptoLibrary.decrypt_secret(text, nonce, password, user_sauce)).toBe(data)

  it 'encrypt_secret', inject (cryptoLibrary) ->
    bytes_nonce = 24
    data = '12345'
    password = 'myPassword'
    user_sauce = '6168de45af90c335967a8f9eae76f8f19bcb42fb8c3f602fee35f7617acdc489'
    encrypted_data = cryptoLibrary.encrypt_secret(data, password, user_sauce)
    expect(encrypted_data.text).not.toBe(undefined)
    expect(encrypted_data.nonce).not.toBe(undefined)
    expect(cryptoLibrary.from_hex(encrypted_data.text).length).toBeGreaterThan(0)
    expect(cryptoLibrary.from_hex(encrypted_data.nonce).length).toBe(bytes_nonce)
    expect(cryptoLibrary.decrypt_secret(encrypted_data.text, encrypted_data.nonce, password, user_sauce)).toBe(data)

  it 'decrypt_data works', inject (cryptoLibrary) ->
    data = "12345"
    secret_key = '9f3edbf7760d8ec1e8fd4a9c623b4fe569f324bf42c78770ef0a40a56495f92d'
    nonce = 'd65673e9abcf379493bba61a576535a82bcf8d735a915390'
    text = '9429f56f028a82ec44651bb7ea6b9f8baab3cd137e'

    expect(cryptoLibrary.decrypt_data(text, nonce, secret_key)).toBe(data)

  it 'encrypt_data works', inject (cryptoLibrary) ->
    bytes_nonce = 24
    data = "12345"
    secret_key = '9f3edbf7760d8ec1e8fd4a9c623b4fe569f324bf42c78770ef0a40a56495f92d'
    encrypted_data = cryptoLibrary.encrypt_data(data, secret_key)
    expect(encrypted_data.text).not.toBe(undefined)
    expect(encrypted_data.nonce).not.toBe(undefined)
    expect(cryptoLibrary.from_hex(encrypted_data.text).length).toBeGreaterThan(0)
    expect(cryptoLibrary.from_hex(encrypted_data.nonce).length).toBe(bytes_nonce)
    expect(cryptoLibrary.decrypt_data(encrypted_data.text, encrypted_data.nonce, secret_key)).toBe(data)


  it 'decrypt_data_public_key works', inject (cryptoLibrary) ->
    data = "12345"
    pair = {
      public_key: 'ed7293c239164855aca4c2e6edb19e09bba41e3451603ec427782d45f2d57b39'
      private_key: '035f8aa4c86658a36d995df47c8e3d1e9a7a2a2f3efdcbdc1451ed4354350660'
    }
    pair2 = {
      public_key: '57531faba711e6e9bdea25229e63db4ce6eb79f0872d97cbfec74df0382dbf3a'
      private_key: 'a04c3fbcb4dcf5df44bc433668bb686aac8991f83e993b971e73a0b37ace362c'
    }
    nonce = '538a2fc024e1ff7a791da88874099709bdb60ad62653529b'
    text = '0eedec49906748988b011741c8df4214e4dbeeda76'

    expect(cryptoLibrary.decrypt_data_public_key(text, nonce, pair2.public_key, pair.private_key)).toBe(data)

  it 'encrypt_data_public_key works', inject (cryptoLibrary) ->
    bytes_nonce = 24
    data = "12345"
    pair = {
      public_key: 'ed7293c239164855aca4c2e6edb19e09bba41e3451603ec427782d45f2d57b39'
      private_key: '035f8aa4c86658a36d995df47c8e3d1e9a7a2a2f3efdcbdc1451ed4354350660'
    }
    pair2 = {
      public_key: '57531faba711e6e9bdea25229e63db4ce6eb79f0872d97cbfec74df0382dbf3a'
      private_key: 'a04c3fbcb4dcf5df44bc433668bb686aac8991f83e993b971e73a0b37ace362c'
    }

    encrypted_data = cryptoLibrary.encrypt_data_public_key(data, pair.public_key, pair2.private_key)
    expect(encrypted_data.text).not.toBe(undefined)
    expect(encrypted_data.nonce).not.toBe(undefined)
    expect(cryptoLibrary.from_hex(encrypted_data.text).length).toBeGreaterThan(0)
    expect(cryptoLibrary.from_hex(encrypted_data.nonce).length).toBe(bytes_nonce)
    expect(cryptoLibrary.decrypt_data_public_key(encrypted_data.text, encrypted_data.nonce, pair2.public_key, pair.private_key)).toBe(data)

