import { hasChanged, isObject } from '../shared'
import { isTracking, trackEffects, triggerEffects } from './effect'
import { reactive } from './reactive'

class RefImpl {
  private _value: any
  private _rawValue: any
  private __v_isRef = true
  public dep: any

  constructor(value: any) {
    this._rawValue = value
    this._value = convert(value)
    this.dep = new Set()
  }

  get value() {
    trackRefValue(this.dep)
    return this._value
  }

  set value(newValue) {
    // 无改动时不触发 trigger 操作
    if (!hasChanged(this._rawValue, newValue))
      return

    this._rawValue = newValue
    this._value = convert(newValue)
    triggerEffects(this.dep)// 需要先修改value，再trigger
  }
}

function convert(value: any) {
  return isObject(value) ? reactive(value) : value
}

function trackRefValue(dep: any) {
  if (!isTracking())
    return

  trackEffects(dep)
}

export function ref(raw: any) {
  return new RefImpl(raw)
}

export function isRef(raw: any) {
  return !!raw.__v_isRef
}

export function unRef(raw: any) {
  return isRef(raw) ? raw.value : raw
}
