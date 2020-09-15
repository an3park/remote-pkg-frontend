// Modules to control application life and create native browser window
import { app, BrowserWindow, Menu, dialog, ipcMain } from 'electron'
import path from 'path'
import { promises as fs, constants } from 'fs'
import { MDNSsearch } from './MDNSsearch'
import express from 'express'

Menu.setApplicationMenu(null)

const searchps = new MDNSsearch()

const server = express()
server.get('/:hash', async (req, res) => {
  try {
    const hash = req.params.hash
    const file = Buffer.from(hash, 'hex').toString('utf-8')
    await fs.access(file, constants.R_OK)
    res.sendFile(file)
  } catch (error) {
    res.sendStatus(404)
  }
})

global.PORT = 44321
const stopTrying = PORT + 5
const startServer = () => {
  server
    .listen(++PORT, () => console.log('[OK] server on port ' + PORT))
    .once('error', err => {
      if (PORT > stopTrying) throw err
      startServer()
    })
}
startServer()

let openedDialog = false
ipcMain.on('add-files', async (event, arg) => {
  if (openedDialog) return
  try {
    openedDialog = true
    const res = await dialog.showOpenDialog({
      properties: ['multiSelections'],
      filters: [
        { name: 'Game archs', extensions: ['pkg'] },
        { name: 'All files', extensions: ['*'] }
      ]
    })
    openedDialog = false
    if (res.canceled) return

    for (const path of res.filePaths) {
      const { size } = await fs.stat(path)
      const meta = await gameMetaRead(path)
      const newfile = {
        path,
        ...meta,
        filesize: size,
        hash: Buffer.from(path, 'utf-8').toString('hex')
      }
      event.reply('new-file', newfile)
    }
  } catch (err) {
    openedDialog = false
    dialog.showErrorBox(err.name || 'Error', err.message || err)
  }
})

async function gameMetaRead(path) {
  try {
    const bytes = 36
    const fd = await fs.open(path)
    const buf = Buffer.alloc(bytes)
    const { bytesRead } = await fd.read(buf, 0, bytes, 64)
    fd.close()
    if (bytesRead !== bytes) throw 'read error'
    const header = buf.toString()
    const title_id = (header.match(/\w+-([a-z0-9]+)\w+-\w+/i) || [])[1]
    return { header, title_id }
  } catch (err) {
    console.log(err)
  }
}

const $ = (global.$ = {})

!(async () => {
  try {
    await app.whenReady()
    createWindow()

    app.on('activate', function () {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  } catch (err) {
    console.log(err)
    dialog.showErrorBox(err.name || 'Error', err.message || err)
  }
})()

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true
    }
  })
  // and load the index.html of the app.
  if (process.env.NODE_ENV === 'development') {
    const PORT = process.env.PORT || 3030
    mainWindow.loadURL('http://127.0.0.1:' + PORT)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile('./build/renderer/index.html')
  }
  searchps.on('device', dev => {
    console.log('[DEVICE]', dev)
    mainWindow.webContents.send('device', dev)
  })
  ipcMain.on('discover', () => {
    if (__DEV__) {
      // add fake devices
      setTimeout(() => {
        mainWindow.webContents.send('device', {
          psip: '192.168.1.88',
          myip: '192.168.132',
          name: 'PS8-FAKE'
        })
        mainWindow.webContents.send('device', {
          psip: '10.10.10.123',
          myip: '10.10.10.6',
          name: 'PS3-FAKE'
        })
      }, 1000)
    }
    searchps.search()
  })
}
