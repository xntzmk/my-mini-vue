export const extend = Object.assign

export function isObject(val: null) {
  return val !== null && typeof val === 'object'
}

export function hasChanged(val: any, newVal: any) {
  return !Object.is(val, newVal)
}

export function hasOwn(target: object, key: string | symbol) {
  return Object.prototype.hasOwnProperty.call(target, key)
}
