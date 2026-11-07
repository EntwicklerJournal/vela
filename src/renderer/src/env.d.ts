export interface VelaApi {
  versionen: {
    electron: string
    chrome: string
    node: string
  }
}

declare global {
  interface Window {
    vela: VelaApi
  }
}
