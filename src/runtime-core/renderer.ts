import { effect } from '../reactivity/effect'
import { EMPTY_OBJ } from '../shared'
import { ShapeFlags } from '../shared/shapeFlags'
import { createComponentInstance, setupComponent } from './component'
import { createAppAPI } from './createApp'
import { Fragment, Text } from './vnode'

export function createRenderer(options: any) {
  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText,
  } = options

  function render(vnode: any, container: any) {
  // render 里只做 patch
    patch(null, vnode, container, null)
  }

  // 根据 vnode 的类型进行 组件/元素 的处理
  function patch(n1: any, n2: any, container: any, parentComponent: any) {
    const { shapeFlag, type } = n2
    switch (type) {
      case Fragment:
        processFragment(n1, n2, container, parentComponent)
        break
      case Text:
        processText(n1, n2, container)
        break

      default:
        if (shapeFlag & ShapeFlags.ELEMENT)
          processElement(n1, n2, container, parentComponent)
        else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT)
          processComponent(n1, n2, container, parentComponent)
        break
    }
  }

  function processText(n1: any, n2: any, container: any) {
    const { children } = n2
    const textNode = (n2.el = document.createTextNode(children))
    container.append(textNode)
  }

  // fragment 不需要进行其 vnode 处理, 只需要渲染/处理 children (替换掉了 container)
  function processFragment(n1: any, n2: any, container: any, parentComponent: any) {
    mountChildren(n2.children, container, parentComponent)
  }

  function processElement(n1: any, n2: any, container: any, parentComponent: any) {
    if (!n1)
      mountElement(n2, container, parentComponent)
    else
      patchElement(n1, n2, container, parentComponent)
  }

  function patchElement(n1: any, n2: any, container: any, parentComponent: any) {
    console.log('patchElement')
    console.log('n1:', n1)
    console.log('n2:', n2)

    const oldProps = n1.props || EMPTY_OBJ
    const newProps = n2.props || EMPTY_OBJ

    const el = (n2.el = n1.el)

    patchChildren(n1, n2, el, parentComponent) // 这里的 container 是 el(当前 patch 的 vnode) ----- 而不是 container
    patchProps(el, oldProps, newProps)
  }

  function patchChildren(n1: any, n2: any, container: any, parentComponent: any) {
    const prevShapeFlag = n1.shapeFlag
    const c1 = n1.children
    const { shapeFlag } = n2
    const c2 = n2.children

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN)
        unmountChildren(c1)
      if (c1 !== c2)
        hostSetElementText(container, c2)
    }
    else {
      if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        hostSetElementText(container, '')
        mountChildren(c2, container, parentComponent)
      }
    }
  }

  function unmountChildren(children: any) {
    for (let i = 0; i < children.length; i++) {
      const el = children[i].el
      // remove 操作
      hostRemove(el)
    }
  }

  function patchProps(el: any, oldProps: any, newProps: any) {
    if (oldProps !== newProps) {
      // prop 值改变/变成undefined/变成null
      for (const key in newProps) {
        const prevProp = oldProps[key]
        const nextProp = newProps[key]

        if (prevProp !== nextProp)
          hostPatchProp(el, key, prevProp, nextProp)
      }

      if (oldProps !== EMPTY_OBJ) {
      // key 值在新props里没有
        for (const key in oldProps) {
          if (!(key in newProps))
            hostPatchProp(el, key, oldProps[key], null)
        }
      }
    }
  }

  function mountElement(vnode: any, container: any, parentComponent: any) {
    // vnode -> element -> div
    const { type, props, children, shapeFlag } = vnode

    // 创建元素
    const el = (vnode.el = hostCreateElement(type)) // 存储 $el

    // children: Array / String
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN)
      el.textContent = children
    else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN)
      mountChildren(vnode.children, el, parentComponent)

    // 设置元素 Prop
    for (const key in props) {
      const val = props[key]
      hostPatchProp(el, key, null, val)
    }

    // 插入元素
    hostInsert(el, container)
  }

  function mountChildren(children: any, container: any, parentComponent: any) {
    children.forEach((v: any) => {
      patch(null, v, container, parentComponent)
    })
  }

  function processComponent(n1: any, n2: any, container: any, parentComponent: any) {
    mountComponent(n2, container, parentComponent)
  }

  function mountComponent(initialVNode: any, container: any, parentComponent: any) {
  // 根据 vnode 创建组件实例
    const instance = createComponentInstance(initialVNode, parentComponent)

    // 初始化组件实例
    setupComponent(instance)
    // 进行 render
    setupRenderEffect(instance, initialVNode, container)
  }

  function setupRenderEffect(instance: any, initialVNode: any, container: any) {
    effect(() => {
      if (!instance.isMounted) {
        /** 初始化 */
        const { proxy } = instance

        // 实例的 render 函数会触发响应式对象的 getter
        const subTree = (instance.subTree = instance.render.apply(proxy)) // 存储节点树

        patch(null, subTree, container, instance)
        initialVNode.el = subTree.el // 在所有的 subTree 初始化完成后，赋值 $el
        instance.isMounted = true
      }
      else {
        /** 更新 */
        const { proxy } = instance
        const subTree = instance.render.apply(proxy)
        const prevSubTree = instance.subTree
        instance.subTree = subTree // 更新 subTree

        patch(prevSubTree, subTree, container, instance)
      }
    })
  }

  return {
    createApp: createAppAPI(render),
  }
}
