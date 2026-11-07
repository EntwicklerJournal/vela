import { app, screen, type BrowserWindow } from 'electron'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

export interface Fensterzustand {
  x?: number
  y?: number
  width: number
  height: number
  maximiert: boolean
  vollbild: boolean
}

const STANDARD: Fensterzustand = {
  width: 1100,
  height: 720,
  maximiert: false,
  vollbild: false
}

function pfad(): string {
  return join(app.getPath('userData'), 'fensterzustand.json')
}

function liegtAufEinemBildschirm(zustand: Fensterzustand): boolean {
  if (zustand.x === undefined || zustand.y === undefined) return false

  return screen.getAllDisplays().some(({ workArea }) => {
    return (
      zustand.x! >= workArea.x &&
      zustand.y! >= workArea.y &&
      zustand.x! < workArea.x + workArea.width &&
      zustand.y! < workArea.y + workArea.height
    )
  })
}

export function zustandLaden(): Fensterzustand {
  try {
    const gelesen = {
      ...STANDARD,
      ...JSON.parse(readFileSync(pfad(), 'utf-8'))
    } as Fensterzustand

    if (!liegtAufEinemBildschirm(gelesen)) {
      delete gelesen.x
      delete gelesen.y
    }

    return gelesen
  } catch {
    return { ...STANDARD }
  }
}

function schreiben(fenster: BrowserWindow): void {
  if (fenster.isDestroyed()) return

  const { x, y, width, height } = fenster.getNormalBounds()

  const zustand: Fensterzustand = {
    x,
    y,
    width,
    height,
    maximiert: fenster.isMaximized(),
    vollbild: fenster.isFullScreen()
  }

  try {
    mkdirSync(dirname(pfad()), { recursive: true })
    writeFileSync(pfad(), JSON.stringify(zustand, null, 2), 'utf-8')
  } catch (fehler) {
    console.error('Fensterzustand nicht gespeichert:', fehler)
  }
}

export function zustandUeberwachen(fenster: BrowserWindow): void {
  let timer: NodeJS.Timeout | undefined

  const verzoegertSichern = (): void => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => schreiben(fenster), 400)
  }

  fenster.on('resize', verzoegertSichern)
  fenster.on('move', verzoegertSichern)
  fenster.on('maximize', verzoegertSichern)
  fenster.on('unmaximize', verzoegertSichern)
  fenster.on('enter-full-screen', verzoegertSichern)
  fenster.on('leave-full-screen', verzoegertSichern)

  fenster.on('close', () => {
    if (timer) clearTimeout(timer)
    schreiben(fenster)
  })
}
