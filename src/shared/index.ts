export const extend = Object.assign

export const EMPTY_OBJ = {}

export function isObject(val: null) {
  return val !== null && typeof val === 'object'
}

export function isString(val: any) {
  return typeof val === 'string'
}

export function hasChanged(val: any, newVal: any) {
  return !Object.is(val, newVal)
}

export function hasOwn(target: object, key: string | symbol) {
  return Object.prototype.hasOwnProperty.call(target, key)
}

export function camelize(str: string) {
  return str.replace(/-(\w)/, (_, c: string) => c ? c.toLocaleUpperCase() : '')
}

function capitalize(str: string) {
  return str.charAt(0).toLocaleUpperCase() + str.slice(1)
}

export function toHandlerKey(str: string) {
  return str ? `on${capitalize(str)}` : ''
}
