
import decorator from './decorator'


/**
 * Ensure that a property is set (or not set), and thus invoke the
 * decorated method conditionally.
 *
 *    @ensure('collapsed')
 *    _doSomething() { ... }
 *
 * which is the same as writing `if (!this.collapsed) { return; }` as the
 * first line of the method.
 *
 * Negate the test by prefixing it with an '!'
 *
 *    @ensure('!expanded')
 *    _doSomething() { ... }
 *
 *
 * No vanilla call possible.
 *
 */
export const ensure = decorator(
    function ensure(target, fnName, descriptor, attribute) {
  let fn = descriptor.value
  let not = attribute[0] === '!'
  if (not) {
    attribute = attribute.slice(1)
  }
  descriptor.value = function(...args) {
    let value = Boolean(this[attribute])
    if (not) {
      value = !value
    }
    if (value) {
      fn.apply(this, args)
    }
  }
})

/**
 * Ensure that a function gets computed only when all arguments fulfill
 * a predicate, otherwise return a default value.
 *
 * Typically:
 *
 *    @observer('(enabled, data)')
 *    @ensureAll(Boolean, {otherwise: null})
 *    _doStuff(enabled, data) { ... }
 *
 * In the example `Boolean` is the predicate.
 *
 */
export const ensureAll = decorator(
    function ensureAll(target, fnName, descriptor,
                       pred=Boolean, {otherwise}={otherwise: null}) {
  let fn = descriptor.value || descriptor.initializer()
  descriptor.value = function(...args) {
    if (args.every(pred)) {
      return fn.apply(this, args)
    }
    return otherwise
  }
})