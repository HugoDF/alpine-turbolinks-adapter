export function isValidVersion (required, current) {
  const requiredArray = required.split('.')
  const currentArray = current.split('.')
  for (let i = 0; i < requiredArray.length; i++) {
    if (!currentArray[i] || currentArray[i] < requiredArray[i]) {
      return false
    }
  }
  return true
}

export function domReady (callback) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback)
  } else {
    callback()
  }
}
