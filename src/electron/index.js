const { app, BrowserWindow, session, ipcMain, shell } = require('electron');
const path = require('path');
const process = require('process');
const configJson = require('./config_json');

require('update-electron-app')({
  repo: 'psono/psono-client',
  updateInterval: '1 hour',
  logger: require('electron-log')
})

// we force that everything is sandboxed as we are loading untrusted content (e.g. by redirecting to an OAUTH provider)
app.enableSandbox()

if (process.platform === 'win32') {
  app.setAppUserModelId("Psono");
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}


const createWindow = () => {

  // secure CSP
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ["default-src 'none';  manifest-src 'self'; connect-src *; font-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self' 'unsafe-inline'; object-src 'self'; child-src 'self'"]
      }
    })
  })

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    icon: path.join(__dirname, 'images', 'icon.png'),
    backgroundColor: '#151f2b',
    width: 1024,
    height: 768,
    minWidth: 800,
    minHeight: 750,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#151f2b',
      symbolColor: '#b1b6c1',
      height: 32
    }
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();

  const {session: {webRequest}} = mainWindow.webContents;

  mainWindow.webContents.on('will-navigate', function(e, url) {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      e.preventDefault();
      shell.openExternal(url);
    }
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  webRequest.onBeforeRequest({
    urls: [
      'https://psono.com/redirect*'
    ]
  }, async ({url}) => {
      const hash  = url.slice('https://psono.com/redirect#'.length)
      await mainWindow.loadFile('src/index.html', { hash: hash });
  });


};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  ipcMain.handle('getConfigJson', configJson.get)
  return createWindow()
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
