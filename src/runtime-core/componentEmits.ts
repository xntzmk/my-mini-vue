import { camelize, hasOwn, toHandlerKey } from '../shared/index'

export function emit(instance: any, event: any, ...args: any) {
  const { props } = instance

  // TPP: 实现一个特定的行为 -> 重构成通用的行为
  const handlerEvent = toHandlerKey(camelize(event))
  if (hasOwn(props, handlerEvent))
    props[handlerEvent](...args)
}
