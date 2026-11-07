import { app, BrowserWindow, screen } from 'electron'
import { join } from 'node:path'
import { zustandLaden, zustandUeberwachen } from './fensterzustand'

let hauptfenster: BrowserWindow | null = null

function fensterErzeugen(): void {
  const zustand = zustandLaden()

  hauptfenster = new BrowserWindow({
    x: zustand.x,
    y: zustand.y,
    width: zustand.width,
    height: zustand.height,

    // Nur setzen, wenn true. Ein explizites `fullscreen: false`
    // deaktiviert den Vollbildmodus auf macOS dauerhaft — der grüne
    // Knopf zoomt dann nur noch. Siehe Kapitel 4, Fallstrick 2.
    ...(zustand.vollbild ? { fullscreen: true } : {}),

    minWidth: 600,
    minHeight: 400,
    show: false,
    title: 'Vela',
    backgroundColor: '#1e1e1e',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  zustandUeberwachen(hauptfenster)
  diagnoseAnhaengen(hauptfenster)

  hauptfenster.on('ready-to-show', () => {
    if (!hauptfenster) return
    // Maximieren erst am sichtbaren Fenster — auf macOS wird der
    // Aufruf auf einem versteckten Fenster ignoriert.
    if (zustand.maximiert && !zustand.vollbild) hauptfenster.maximize()
    hauptfenster.show()
  })

  hauptfenster.on('closed', () => {
    hauptfenster = null
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    hauptfenster.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    hauptfenster.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// ---------------------------------------------------------------------
// TEMPORÄR — Diagnose für Kapitel 4.
// Nach der Prüfung diese Funktion, ihren Aufruf oben und `screen`
// aus dem Import in Zeile 1 entfernen.
// ---------------------------------------------------------------------
function diagnoseAnhaengen(fenster: BrowserWindow): void {
  const zeigen = (anlass: string): void => {
    if (fenster.isDestroyed()) return
    const display = screen.getDisplayMatching(fenster.getBounds())
    console.log(
      anlass.padEnd(18),
      'max:',
      String(fenster.isMaximized()).padEnd(5),
      'voll:',
      String(fenster.isFullScreen()).padEnd(5),
      '| fenster:',
      JSON.stringify(fenster.getBounds()),
      '| workArea:',
      JSON.stringify(display.workArea),
      '| screen:',
      JSON.stringify(display.bounds)
    )
  }

  fenster.on('maximize', () => zeigen('maximize'))
  fenster.on('unmaximize', () => zeigen('unmaximize'))
  fenster.on('enter-full-screen', () => zeigen('enter-full-screen'))
  fenster.on('leave-full-screen', () => zeigen('leave-full-screen'))
  fenster.once('ready-to-show', () => zeigen('start'))
}

// ---------------------------------------------------------------------

const einzelinstanz = app.requestSingleInstanceLock()

if (!einzelinstanz) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (!hauptfenster) return
    if (hauptfenster.isMinimized()) hauptfenster.restore()
    hauptfenster.focus()
  })

  app.whenReady().then(() => {
    fensterErzeugen()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) fensterErzeugen()
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
}