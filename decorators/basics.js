
import decorator from './decorator'

export function log(target, name, descriptor) {
  let fn = descriptor.value
  if (target.is) {
    name = `<${target.is}>.${name}`
  }
  descriptor.value = function(...args) {
    /* eslint-disable no-console */
    console.log('%c' + name, 'font-weight: 700', ...args)
    /* eslint-enable no-console */
    return fn.apply(this, args)
  }
}

export function perf(target, name, descriptor) {
  let fn = descriptor.value
  descriptor.value = function(...args) {
    let before = window.performance.now()
    let rv = fn.apply(this, args)
    let after = window.performance.now()
    let delta = after - before
    let argsSignature = args.join(', ')
    let callSignature = `${name}(${argsSignature})`
    /* eslint-disable no-console */
    console.log(`${callSignature} took ${delta}ms`)
    /* eslint-enable no-console */
    return rv
  }
}

/**
 * Memoize a function which accepts exactly one argument.
 */
export function memoize1 (target, fnName, descriptor) {
  let fn = descriptor.value
  let cacheName = `__memoize_cache_${fnName}__`
  descriptor.value = function(arg) {
    let cache = this[cacheName]
    if (!cache) {
      cache = this[cacheName] = {}
    }
    if (arg in cache) {
      return cache[arg]
    }
    return (cache[arg] = fn.call(this, arg))
  }
}

