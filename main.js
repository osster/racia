const { app, BrowserWindow } = require('electron');
const { ipcMain, dialog, getCurrentWindow } = require('electron')

const url = require("url");
const path = require("path");
const fs = require("fs");

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(app.getAppPath(), 'preload.js')
    }
  })
  
  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, `./dist/index.html`),
      protocol: "file:",
      slashes: true
    })
  );
  mainWindow.on('closed', function () {
    mainWindow = null
  })
}

// console.log(app);
app.on('ready', () => {
  ipcMain.handle('dialog:saveFile', async function (event, options) {
    return await dialog.showSaveDialog(null, options);
  })
  createWindow();
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
  if (mainWindow === null) createWindow()
})


