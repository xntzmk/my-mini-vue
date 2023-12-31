import { ShapeFlags } from '@xntzmk-mini-vue/shared'

export const Fragment = Symbol('Fragment')
export const Text = Symbol('Text')

export function createVNode(type: any, props?: any, children?: any) {
  const vnode = {
    type,
    props,
    key: props && props.key,
    children,
    el: null,
    shapeFlag: getShapeFlag(type),
  }

  if (typeof children === 'string')
    vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN
  else if (Array.isArray(children))
    vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN

  // slot: 组件 + object children
  if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    if (typeof children === 'object')
      vnode.shapeFlag |= ShapeFlags.SLOT_CHILDREN
  }

  return vnode
}

export function createTextVNode(text: string) {
  return createVNode(Text, {}, text)
}

function getShapeFlag(type: any) {
  return typeof type === 'string'
    ? ShapeFlags.ELEMENT
    : ShapeFlags.STATEFUL_COMPONENT
}
