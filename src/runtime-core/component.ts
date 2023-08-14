import { shallowReadonly } from '../reactivity/reactive'
import { proxyRefs } from '../reactivity/ref'
import { isObject } from '../shared/index'
import { emit } from './componentEmits'
import { initProps } from './componentProps'
import { PublicInstanceProxyHandlers } from './componentPublicInstance'
import { initSlots } from './componentSlots'

export function createComponentInstance(vnode: any, parent: any) {
  const component = {
    vnode,
    type: vnode.type,
    setupState: {}, // 存储 setup 函数的返回值
    props: {},
    slots: {},
    provides: parent ? parent.provides : {}, // 先赋值为父级的 provides, 方便初始化原型时进行判断
    parent,
    subTree: {}, // 存储上一次的虚拟树
    isMounted: false,
    emit: () => ({}),
  }

  component.emit = emit.bind(null, component) as any

  return component
}

export function setupComponent(instance: any) {
  const { props, children } = instance.vnode
  // initProps
  initProps(instance, props)

  // initSlots
  initSlots(instance, children)

  setupStatefulComponent(instance)
}

function setupStatefulComponent(instance: any) {
  const component = instance.type

  // ctx
  instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers)

  const { setup } = component
  // 用户可能不写 setup
  if (setup) {
    setCurrentInstance(instance)
    const setupResult = setup(
      shallowReadonly(instance.props),
      { emit: instance.emit },
    )
    setCurrentInstance(null)
    handleSetupResult(instance, setupResult)
  }
}

function handleSetupResult(instance: any, setupResult: any) {
  // function object
  if (isObject(setupResult))
    instance.setupState = proxyRefs(setupResult) // render 解析 ref.value

  // 保证组件的 render 一定有值
  finishComponentSetup(instance)
}

function finishComponentSetup(instance: any) {
  const component = instance.type

  if (component.render)
    instance.render = component.render
}

// currentInstance
let currentInstance: any = null
export function getCurrentInstance() {
  return currentInstance
}
function setCurrentInstance(value: any) {
  currentInstance = value
}
