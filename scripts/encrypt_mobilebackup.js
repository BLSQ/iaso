#!/usr/bin/env node

// Encrypt a mobile backup file using the public key
// e.g. `encrypt.js 2016.backup.enc > data.json`

'use strict'

const fs = require('fs')
const jose = require('node-jose')

if (process.argv.length < 3) {
  console.error('usage: encrypt.js privatekey-str file')
  process.exit(1)
}
const file = process.argv[3]
const data = fs.readFileSync(file)

const publicKey = {
  'kty': 'RSA',
  'kid': 'sense-hat',
  'alg': 'RSA-OAEP-256',
  'e': 'AQAB',
  'n': '2G5UoUM1uvXlh8s33rHivATuAsp_TvBGJGWw6ESnfhoqwsPVTeu0hXQVHh_C1okRLRYpjPpb-dhEKg9kfm5P6s0cnAFw-9dNd_5KZxNyHlnE3m0xy3x4QfHv1BXYMdC31btSttiVjP4GtlqpmtdzZgguo9f10IRlSQKQrIE7MMJhOJbPRmC-7xDXgF3-rLz4NLfcLQ_LSMvXaAbuLgTmPXnOMBiPYEExrJ3ZzyT5ImO98fOcUdpw_A4FLNBEcjX9TTnVjrE1XSxHQIa7-H28F5oxkroU4_dVmmmTTGd9cNWHpkYvb_UXVKItYJKOn0O5voIrzOaqfDpVjev369_5Yw'
}

jose.JWK.asKey(publicKey)
  .then((key) => {
    return jose.JWE.createEncrypt({ compact: true }, key)
      .update(encodeURIComponent(data))
      .final()
  })
  .then((result) => {
    console.log(result)
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
