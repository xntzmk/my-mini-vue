export const extend = Object.assign

export function isObject(val: null) {
  return val !== null && typeof val === 'object'
}

export function hasChanged(val: any, newVal: any) {
  return !Object.is(val, newVal)
}
