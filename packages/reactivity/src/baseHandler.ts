import { extend, isObject } from '@xntzmk-mini-vue/shared'
import { track, trigger } from './effect'
import { reactive, readonly } from './reactive'

const get = createGetter()
const set = createSetter()
const readonlyGet = createGetter(true)
const shallowReadonlyGet = createGetter(true, true)

export enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive',
  IS_READONLY = '__v_isReadonly',
}

export function createGetter(isReadonly = false, shallow = false) {
  return function (target: any, key: any) {
    const res = Reflect.get(target, key)

    if (key === ReactiveFlags.IS_REACTIVE)
      return !isReadonly
    if (key === ReactiveFlags.IS_READONLY)
      return isReadonly

    if (shallow)
      return res

    // res 为对象，再次添加代理
    if (isObject(res))
      return isReadonly ? readonly(res) : reactive(res)

    // 依赖收集
    if (!isReadonly)
      track(target, key)

    return res
  }
}

function createSetter() {
  return function (target: any, key: any, value: any) {
    const res = Reflect.set(target, key, value)

    // 触发依赖
    trigger(target, key)

    return res
  }
}

export const mutableHandlers = {
  get,
  set,
}

export const readonlyHandlers = {
  get: readonlyGet,
  set(target: any, key: any, value: any) {
    console.warn(`key:${key} set 失败，因为 target 是 readonly 类型`)
    return true
  },
}

export const shallowReadonlyHandlers = extend(
  {},
  readonlyHandlers,
  {
    get: shallowReadonlyGet,
  },
)
