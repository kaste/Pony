
import decorator from './decorator'
import {installPropertyObserver, installComplexObserver} from './helpers'
import {debounce} from './debounce'

/**
 * Install observers for a property or a tuple of properties.
 *
 * Declare either _one_ dependency (as a string) to get a simple property
 * observer. The registered function gets the new and the old value, whenever
 * the property changes. Like so:
 *
 *    @observer('active')
 *    _activeChanged(val, old) { ... }
 *
 * If you want to listen to multiple properties, enclose all dependencies with
 * parentheses. Like so:
 *
 *    @observer('(enabled, data)')
 *    _doStuff(enabled, data) { ... }
 *
 *
 */
export const observer = decorator(
    function observer(target, fnName, descriptor, argumentDeclaration) {

  if (argumentDeclaration) {
    // @observer('foo') fooChanged() {}
    if (argumentDeclaration[0] !== '(') {
      let propertyName = argumentDeclaration
      installPropertyObserver(target, fnName, propertyName)
      return
    }

    // @observer('(foo, bar)') sideEffect(foo, bar) {}
    installComplexObserver(target, fnName, argumentDeclaration)
    return
  }


  // FWIW
  // @observer _fooChanged() {}
  // or: @observer fooChanged() {}
  let matches = fnName.match(/(?:_)?(.+)Changed/)
  if (matches) {
    let propertyName = matches[1]
    installPropertyObserver(target, fnName, propertyName)
    return
  }

  throw new Error(`Can't guess what to observe for ${fnName}`)
})

/**
 * Declare an async observer, which is just a normal observer with
 * debounced (delayed) execution.
 *
 * Essentially
 *
 *    @asyncObserver('(foo, bar)')
 *    doStuff() { ... }
 *
 * should be exactly the same as:
 *
 *    @observer('(foo, bar)')
 *    @debounce
 *    _doStuff() { ... }
 */
export const asyncObserver = decorator(
    function asyncObserver(target, fnName, descriptor, argumentDeclaration) {

  observer(argumentDeclaration)(target, fnName, descriptor)
  debounce(target, fnName, descriptor)
})

