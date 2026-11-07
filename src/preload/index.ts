import { contextBridge } from 'electron'

const api = {
  versionen: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node
  }
}

contextBridge.exposeInMainWorld('vela', api)
