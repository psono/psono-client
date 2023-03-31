module.exports = {
  packagerConfig: {
    icon: 'images/icon',
    executableName: 'psono',
    osxSign: {}, // object must exist even if empty
    osxNotarize: {
      tool: 'notarytool',
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_APPLICATION_SPECIFIC_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID,
    }
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        authors: 'esaqa GmbH',
        iconUrl: 'https://static.esaqa.com/assets/psono256x256.ico',
        setupIcon: 'images/icon.ico',
        certificateFile: '../cert.pfx',
        certificatePassword: process.env.WINDOWS_SIGNING_CERTIFICATE_PASSWORD
      },
    },
    {
      name: '@electron-forge/maker-wix',
      config: {
        language: 1033,
        name: 'Psono',
        upgradeCode: '9bfa6820-f37f-42f6-9977-369f8970366f',
        manufacturer: 'esaqa GmbH',
        certificateFile: '../cert.pfx',
        features: {
          autoUpdate: true,
          autoLaunch: true,
        },
        ui: {
          chooseDirectory: true,
        },
        certificatePassword: process.env.WINDOWS_SIGNING_CERTIFICATE_PASSWORD
      }
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          maintainer: 'esaqa GmbH',
          homepage: 'https://psono.com',
          icon: 'images/icon.png'
        }
      }
    },
    {
      name: '@electron-forge/maker-dmg',
      config: {
        icon: 'images/icon.icns',
        name: 'Psono',
        background: 'installer/mac/background.png',
        overwrite: true,
      }
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {
        options: {
          homepage: 'https://psono.com'
        }
      },
    },
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'psono',
          name: 'psono-client'
        }
      }
    }
  ]
};
