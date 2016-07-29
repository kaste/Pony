
/**
 * A decorator for decorators so that they support vanilla and parametrized
 * calls.
 *
 * E.g.
 *
 *    @decorator
 *    log(target, name, descriptor, scope='') {
 *      ...
 *    }
 *
 * You can now use `log` either 'vanilla' like
 *
 *    @log
 *    foo() { ... }
 *
 * or parametrized
 *
 *    @log('fooScope')
 *    foo() { ... }
 *
 * This decorator can decorate methods and functions. Since JS does
 * not support the `@`-syntax on functions, you have to wrap the function
 * manually:
 *
 *    decorator(function log(target, name, descriptor) { ... })
 *
 *
 */

export default function decorator (target, name, descriptor) {
    // support using decorator(fn) as well as
    // @decorator foo() {}
    let functionApplication = arguments.length === 1
    let fn = functionApplication ? target : descriptor.value

    function decoratedDecorator(...args) {
    // function decoratedDecorator(target, name, descriptor) {

      // vanilla call @myDecorator
      if (args.length === 3) {
        fn(...args)
      } else {
      // @myDecorator({name: value})
        let options = args
        return function(target, name, descriptor) {
          fn(target, name, descriptor, ...args)
        }
      }

    }

    if (functionApplication) {
      return decoratedDecorator
    } else {
      descriptor.value = decoratedDecorator
    }
}
