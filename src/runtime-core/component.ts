import { isObject } from '../shared/index'
import { PublicInstanceProxyHandlers } from './componentPublicInstance'

export function createComponentInstance(vnode: any) {
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
  }

  return component
}

export function setupComponent(instance: any) {
  // initProps
  // initSlots

  setupStatefulComponent(instance)
}

function setupStatefulComponent(instance: any) {
  const component = instance.type

  // ctx
  instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers)

  const { setup } = component
  // 用户可能不写 setup
  if (setup) {
    const setupResult = setup()
    handleSetupResult(instance, setupResult)
  }
}

function handleSetupResult(instance: any, setupResult: any) {
  // function object
  if (isObject(setupResult))
    instance.setupState = setupResult

  // 保证组件的 render 一定有值
  finishComponentSetup(instance)
}

function finishComponentSetup(instance: any) {
  const component = instance.type

  if (component.render)
    instance.render = component.render
}
