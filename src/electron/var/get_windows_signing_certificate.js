const fs = require('fs')

const Readable = require('stream').Readable

function main() {

    if (!process.env.WINDOWS_SIGNING_CERTIFICATE) {
        return;
    }

    const imgBuffer = Buffer.from(process.env.WINDOWS_SIGNING_CERTIFICATE, 'base64')
    const s = new Readable()

    s.push(imgBuffer)
    s.push(null)

    s.pipe(fs.createWriteStream("../cert.pfx"));
}

main()
