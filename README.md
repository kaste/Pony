
Decorators for Polymer
======================


`Pony.decorators` provides useful decorators which makes writing and
especially __reading__ Polymer elements a lot easier.

We have decorators for defining properties on the elements, for handling
side-effects, for the overall program flow, and for throttling.

Let's see some of it:

```javascript

// Use rollup then this will work
import {attribute, property, computed,
        observer, on, debounce, throttle} from 'Pony.decorators'

// Oldschool:
// let {attribute, property} = Pony.decorators

Polymer({

  @attribute        // instead of reflectToAttribute
  enabled: false,   // type inference: Boolean

  @property
  width: 1024,      // type: Number

  @property
  data: Array,      // default value of `undefined`

  @computed('(enabled, width)')
  _width: (_, width) => Math.min(1024, width)
  /* Since computed's are that easy, I bet you will actually use them */


  @observer('(_width, data)')
  @debounce
  redraw(width, data) { ... }

  @on('window resize')
  @throttle({ms: 100})
  _recalcWidth(_) {
    this.width = this.offsetWidth
  }


})
```

For now, please look at the inline docs in the source.




***Notice***: This code is extracted from an app. This extractions is a work-in-progress and maybe everything and all got broken during that.
