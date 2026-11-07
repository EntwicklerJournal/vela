import { app, BrowserWindow } from 'electron'
import { join } from 'node:path'

function fensterErzeugen(): void {
  const fenster = new BrowserWindow({
    width: 1100,
    height: 720,
    show: false,
    title: 'Vela',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  fenster.on('ready-to-show', () => fenster.show())

  if (process.env.ELECTRON_RENDERER_URL) {
    fenster.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    fenster.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  fensterErzeugen()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) fensterErzeugen()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
