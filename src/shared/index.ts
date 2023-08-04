export const extend = Object.assign

export function isObject(val: null) {
  return val !== null && typeof val === 'object'
}
