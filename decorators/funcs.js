
export function popProp(obj, key, def=undefined) {
  if (key in obj) {
    const rv = obj[key]
    delete obj[key]
    return rv
  }
  return def
}



export function arrayHasItem(ary, item) {
  return ary.indexOf(item) !== -1
}



export function downcase(string) {
  return string.charAt(0).toLowerCase() + string.slice(1)
}

export function splitAt(str, idx) {
  return [str.substring(0, idx), str.substring(idx + 1)]
}

export function splitAtLastChar(str, char=' ') {
  // Surprisingly this works for 'click' as well as for 'selector click'.
  const idx = str.lastIndexOf(char)
  return splitAt(str, idx)
}

