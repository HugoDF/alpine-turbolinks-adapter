import Bridge from './bridge'
import { domReady } from './utils'

const initAlpine = window.deferLoadingAlpine || ((callback) => callback())
window.deferLoadingAlpine = (callback) => {
  domReady(() => {
    const bridge = new Bridge()
    bridge.init()
    initAlpine(callback)
  })
}
