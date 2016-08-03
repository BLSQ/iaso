#!/usr/bin/env node

// Decrypt a mobile backup file using a private rsa key in JWK format.
// e.g. `decrypt.js '{...private-key-str...}' 2016.backup.enc > data.json`

'use strict'

const fs = require('fs')
const jose = require('node-jose')

if (process.argv.length < 4) {
  console.error('usage: decrypt.js privatekey-str encrypted-file')
  process.exit(1)
}

const privateKey = JSON.parse(process.argv[2])
const encryptedFile = process.argv[3]

let data = fs.readFileSync(encryptedFile)
jose.JWK.asKey(privateKey)
  .then((key) => {
    return jose.JWE.createDecrypt(key).decrypt(data.toString())
  })
  .then((result) => {
    // The backup data is URI encoded to preserve non ascii characters
    // and therefore must be decoded here.
    const text = decodeURIComponent(result.plaintext).toString('binary')
    console.log(text)
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
