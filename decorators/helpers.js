
export function installProperty(target, name, options) {
  if (!target.properties) {
    target.properties = {}
  }

  target.properties[name] = options
}

export function installPropertyObserver(target, fnName, propertyName) {
  if (!target.properties) {
    target.properties = {}
  }
  if (!target.properties[propertyName]) {
    target.properties[propertyName] = {}
  }
  if (target.properties[propertyName].observer) {
    throw new Error(`Already observing the property ${propertyName}`)
  }
  target.properties[propertyName].observer = fnName
}

export function installComplexObserver(target, fnName, argumentDeclaration) {
  let observeDeclaration = `${fnName}${argumentDeclaration}`
  if (!target.observers) {
    target.observers = []
  }
  target.observers.push(observeDeclaration)
}


export function ensureBehavior(proto, behavior) {
  if (!proto.behaviors) {
    proto.behaviors = []
  }

  if (proto.behaviors.indexOf(behavior) === -1) {
    proto.behaviors.push(behavior)
  }
}