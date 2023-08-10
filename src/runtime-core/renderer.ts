import { ShapeFlags } from '../shared/shapeFlags'
import { createComponentInstance, setupComponent } from './component'

export function render(vnode: any, container: any) {
  // render 里只做 patch
  patch(vnode, container)
}

// 根据 vnode 的类型进行 组件/元素 的处理
function patch(vnode: any, container: any) {
  const { shapeFlag } = vnode
  if (shapeFlag & ShapeFlags.ELEMENT)
    processElement(vnode, container)
  else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT)
    processComponent(vnode, container)
}

function processElement(vnode: any, container: any) {
  mountElement(vnode, container)
}

function mountElement(vnode: any, container: any) {
  // vnode -> element -> div
  const { type, props, children, shapeFlag } = vnode
  const el: HTMLElement = (vnode.el = document.createElement(type)) // 存储 $el

  // children: Array / String
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN)
    el.textContent = children
  else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN)
    mountChildren(vnode, el)

  // props
  for (const key in props)
    el.setAttribute(key, props[key])

  container.append(el)
}

function mountChildren(vnode: any, container: any) {
  vnode.children.forEach((v: any) => {
    patch(v, container)
  })
}

function processComponent(vnode: any, container: any) {
  mountComponent(vnode, container)
}

function mountComponent(initialVNode: any, container: any) {
  // 根据 vnode 创建组件实例
  const instance = createComponentInstance(initialVNode)

  // 初始化组件实例
  setupComponent(instance)
  // 进行 render
  setupRenderEffect(instance, initialVNode, container)
}

function setupRenderEffect(instance: any, initialVNode: any, container: any) {
  const { proxy } = instance
  const subTree = instance.render.apply(proxy)

  // vnode -> patch
  patch(subTree, container)
  // vnode -> element -> patch
  initialVNode.el = subTree.el // 在所有的 subTree 初始化完成后，赋值 $el
}
