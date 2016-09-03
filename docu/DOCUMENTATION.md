# Documentation

## General
All cryptography is based on https://github.com/3nsoft/ecma-nacl a JavaScript implementation of https://nacl.cr.yp.to/secretbox.html

- **Secret Key cryptography** is based on:
    **XSalsa20 + Poly1305**

- **Public Key cryptography** is based on:
    **Curve25519 + XSalsa20 + Poly1305**


## Registration

    ![Registration process sequence diagram](img/Registration.png)

## Login

    ![Login processe sequence diagram](img/Login.png)