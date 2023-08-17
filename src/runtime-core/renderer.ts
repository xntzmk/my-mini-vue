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
    patch(null, vnode, container, null, null)
  }

  // 根据 vnode 的类型进行 组件/元素 的处理
  function patch(n1: any, n2: any, container: any, parentComponent: any, anchor: any) {
    const { shapeFlag, type } = n2
    switch (type) {
      case Fragment:
        processFragment(n1, n2, container, parentComponent, anchor)
        break
      case Text:
        processText(n1, n2, container)
        break

      default:
        if (shapeFlag & ShapeFlags.ELEMENT)
          processElement(n1, n2, container, parentComponent, anchor)
        else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT)
          processComponent(n1, n2, container, parentComponent, anchor)
        break
    }
  }

  function processText(n1: any, n2: any, container: any) {
    const { children } = n2
    const textNode = (n2.el = document.createTextNode(children))
    container.append(textNode)
  }

  // fragment 不需要进行其 vnode 处理, 只需要渲染/处理 children (替换掉了 container)
  function processFragment(n1: any, n2: any, container: any, parentComponent: any, anchor: any) {
    mountChildren(n2.children, container, parentComponent, anchor)
  }

  function processElement(n1: any, n2: any, container: any, parentComponent: any, anchor: any) {
    if (!n1)
      mountElement(n2, container, parentComponent, anchor)
    else
      patchElement(n1, n2, container, parentComponent, anchor)
  }

  function patchElement(n1: any, n2: any, container: any, parentComponent: any, anchor: any) {
    console.log('patchElement')
    console.log('n1:', n1)
    console.log('n2:', n2)

    const oldProps = n1.props || EMPTY_OBJ
    const newProps = n2.props || EMPTY_OBJ

    const el = (n2.el = n1.el)

    patchChildren(n1, n2, el, parentComponent, anchor) // 这里的 container 是 el(当前 patch 的 vnode) ----- 而不是 container
    patchProps(el, oldProps, newProps)
  }

  function patchChildren(n1: any, n2: any, container: any, parentComponent: any, anchor: any) {
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
        mountChildren(c2, container, parentComponent, anchor)
      }
      else {
        // diff array
        patchKeyedChildren(c1, c2, container, parentComponent, anchor)
      }
    }
  }

  function patchKeyedChildren(c1: any, c2: any, container: any, parentComponent: any, parentAnchor: any) {
    let i = 0
    let e1 = c1.length - 1
    const l2 = c2.length
    let e2 = l2 - 1

    function isSameVNodeType(n1: any, n2: any) {
      return n1.type === n2.type && n1.key === n2.key
    }

    // 1. 左侧对比
    while (i <= e1 && i <= e2) {
      const n1 = c1[i]
      const n2 = c2[i]
      if (isSameVNodeType(n1, n2))
        // 递归判断节点的子节点
        patch(n1, n2, container, parentComponent, parentAnchor)
      else
        break
      i++
    }

    // 2. 右侧对比 (while 条件和左侧的一样)
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1]
      const n2 = c2[e2]
      if (isSameVNodeType(n1, n2))
        patch(n1, n2, container, parentComponent, parentAnchor)
      else
        break

      e1--
      e2--
    }

    /** 新的比老的长 */
    if (i > e1) {
      if (i <= e2) {
        const nextPos = e2 + 1
        const anchor = nextPos < l2 ? c2[nextPos].el : null // 判断是左侧添加还是右侧添加
        console.log(anchor)
        while (i <= e2) {
          patch(null, c2[i], container, parentComponent, anchor)
          i++
        }
      }
    }

    /** 新的比老的短 */
    else if (i > e2) {
      while (i <= e1) {
        hostRemove(c1[i].el)
        i++
      }
    }

    /** 中间对比 */
    else {
      const s1 = i
      const s2 = i

      // 针对删除逻辑的优化 (新比老的少且多余部分可以直接删除的情况)
      const toBePatched = e2 - i + 1 // 记录应该 patch 的数量
      let patched = 0 // 记录已经 patch 的数量

      // 建立新树中间部分的映射，基于 key 进行对比索引位置
      const keyToNewIndexMap = new Map()
      for (let i = s2; i <= e2; i++) {
        const nextChild = c2[i]
        keyToNewIndexMap.set(nextChild.key, i)
      }

      for (let i = s1; i <= e1; i++) {
        const prevChild = c1[i]
        if (patched >= toBePatched) {
          hostRemove(prevChild.el)
          continue
        }

        // 有 key (key!==null & key!==undefined) -> 查找 map
        let newIndex
        if (prevChild.key != null) {
          newIndex = keyToNewIndexMap.get(prevChild.key)
        }
        // 无 key -> 遍历中间乱序部分
        else {
          for (let j = s2; j <= e2; j++) {
            const nextChild = c2[j]
            if (isSameVNodeType(prevChild, nextChild)) {
              newIndex = j
              break
            }
          }
        }

        // 不存在
        if (newIndex === undefined) {
          hostRemove(prevChild.el)
        }
        // 存在
        else {
          patch(prevChild, c2[newIndex], container, parentComponent, null)
          patched++
        }
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

  function mountElement(vnode: any, container: any, parentComponent: any, anchor: any) {
    // vnode -> element -> div
    const { type, props, children, shapeFlag } = vnode

    // 创建元素
    const el = (vnode.el = hostCreateElement(type)) // 存储 $el

    // children: Array / String
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN)
      el.textContent = children
    else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN)
      mountChildren(vnode.children, el, parentComponent, anchor)

    // 设置元素 Prop
    for (const key in props) {
      const val = props[key]
      hostPatchProp(el, key, null, val)
    }

    // 插入元素
    hostInsert(el, container, anchor)
  }

  function mountChildren(children: any, container: any, parentComponent: any, anchor: any) {
    children.forEach((v: any) => {
      patch(null, v, container, parentComponent, anchor)
    })
  }

  function processComponent(n1: any, n2: any, container: any, parentComponent: any, anchor: any) {
    mountComponent(n2, container, parentComponent, anchor)
  }

  function mountComponent(initialVNode: any, container: any, parentComponent: any, anchor: any) {
  // 根据 vnode 创建组件实例
    const instance = createComponentInstance(initialVNode, parentComponent)

    // 初始化组件实例
    setupComponent(instance)
    // 进行 render
    setupRenderEffect(instance, initialVNode, container, anchor)
  }

  function setupRenderEffect(instance: any, initialVNode: any, container: any, anchor: any) {
    effect(() => {
      if (!instance.isMounted) {
        /** 初始化 */
        const { proxy } = instance

        // 实例的 render 函数会触发响应式对象的 getter
        const subTree = (instance.subTree = instance.render.apply(proxy)) // 存储节点树

        patch(null, subTree, container, instance, anchor)
        initialVNode.el = subTree.el // 在所有的 subTree 初始化完成后，赋值 $el
        instance.isMounted = true
      }
      else {
        /** 更新 */
        const { proxy } = instance
        const subTree = instance.render.apply(proxy)
        const prevSubTree = instance.subTree
        instance.subTree = subTree // 更新 subTree

        patch(prevSubTree, subTree, container, instance, anchor)
      }
    })
  }

  return {
    createApp: createAppAPI(render),
  }
}
