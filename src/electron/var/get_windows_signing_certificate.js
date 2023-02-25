var fs = require('fs')

var Readable = require('stream').Readable

const imgBuffer = Buffer.from(process.env.WINDOWS_SIGNING_CERTIFICATE, 'base64')

var s = new Readable()

s.push(imgBuffer)
s.push(null)

s.pipe(fs.createWriteStream("cert.pfx"));
