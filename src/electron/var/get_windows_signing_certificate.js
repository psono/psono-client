const fs = require('fs')
const { execSync } = require('child_process')

const Readable = require('stream').Readable

function checkCertificateExpiration(certPath) {
    try {
        console.log('Checking certificate expiration...')
        const result = execSync(`certutil -dump "${certPath}"`, { encoding: 'utf8' })
        
        // Extract the "NotAfter" date from certutil output
        const notAfterMatch = result.match(/NotAfter:\s*(.+)/i)
        if (notAfterMatch) {
            const expirationDate = new Date(notAfterMatch[1].trim())
            const now = new Date()
            
            console.log(`Certificate expires on: ${expirationDate.toISOString()}`)
            console.log(`Current date: ${now.toISOString()}`)
            
            if (expirationDate < now) {
                console.error('❌ CERTIFICATE HAS EXPIRED!')
                console.error(`Certificate expired ${Math.floor((now - expirationDate) / (1000 * 60 * 60 * 24))} days ago`)
                process.exit(1)
            } else {
                const daysUntilExpiry = Math.floor((expirationDate - now) / (1000 * 60 * 60 * 24))
                console.log(`✅ Certificate is valid. Expires in ${daysUntilExpiry} days`)
                
                if (daysUntilExpiry < 30) {
                    console.warn(`⚠️  WARNING: Certificate expires in ${daysUntilExpiry} days - consider renewing soon`)
                }
            }
        } else {
            console.warn('Could not parse certificate expiration date from certutil output')
        }
    } catch (error) {
        console.error('Error checking certificate expiration:', error.message)
    }
}

function main() {

    if (!process.env.WINDOWS_SIGNING_CERTIFICATE) {
        console.log('No Windows signing certificate provided via WINDOWS_SIGNING_CERTIFICATE environment variable')
        return;
    }

    console.log('Extracting Windows signing certificate...')
    const imgBuffer = Buffer.from(process.env.WINDOWS_SIGNING_CERTIFICATE, 'base64')
    const s = new Readable()

    s.push(imgBuffer)
    s.push(null)

    const certPath = "../cert.pfx"
    s.pipe(fs.createWriteStream(certPath));
    
    // Wait for file to be written, then check expiration
    s.on('end', () => {
        setTimeout(() => {
            if (fs.existsSync(certPath)) {
                checkCertificateExpiration(certPath)
            }
        }, 1000)
    })
}

main()
