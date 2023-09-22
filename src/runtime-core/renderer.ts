/* eslint-disable unicorn/no-new-array */
import { effect } from '../reactivity/effect'
import { EMPTY_OBJ } from '../shared'
import { ShapeFlags } from '../shared/shapeFlags'
import { createComponentInstance, setupComponent } from './component'
import { shouldUpdateComponent } from './componentUpdateUtils'
import { createAppAPI } from './createApp'
import { queueJobs } from './scheduler'
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
    console.log('旧vnode n1:', n1)
    console.log('新vnode n2:', n2)

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
    // 优化一：删除时如果patched数量已到达应有数量，则全部删除
    // 优化二：创建定长新映射数组
    // 优化三：给定key
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

      let moved = false
      let maxNewIndexSoFar = 0

      // 初始化 从新的index映射为老的index
      // 创建数组的时候给定数组的长度，这个是性能最快的写法
      const newIndexToOldIndexMap = new Array(toBePatched)
      for (let i = 0; i < toBePatched; i++)
        newIndexToOldIndexMap[i] = 0

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

        // 不存在的节点 -> 删除
        if (newIndex === undefined) {
          hostRemove(prevChild.el)
        }
        // 存在的节点  -> 移动/不变
        else {
          newIndexToOldIndexMap[newIndex - s2] = i + 1 // +1 防止出现i为0的情况 -> 0 被视为老节点不存在

          // 如果 newIndex 一直为升序，则说明节点没有移动
          if (newIndex >= maxNewIndexSoFar)
            maxNewIndexSoFar = newIndex
          else
            moved = true

          patch(prevChild, c2[newIndex], container, parentComponent, null)
          patched++
        }
      }

      // console.log('原序列', newIndexToOldIndexMap) // [5, 3, 4]
      const increasingNewIndexSequence = moved ? getSequence(newIndexToOldIndexMap) : []
      // console.log('递增子序列', increasingNewIndexSequence) // [1, 2] (索引位置)

      // 在最长递增子序列里查找原序列对应索引是否有变动 (倒序查找，锁定 anchor)
      let j = increasingNewIndexSequence.length - 1
      for (let i = toBePatched - 1; i >= 0; i--) {
        const nextIndex = i + s2
        const nextChild = c2[nextIndex]
        const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null

        // 需要重新创建的节点
        if (newIndexToOldIndexMap[i] === 0) {
          patch(null, nextChild, container, parentComponent, anchor)
        }
        // 需要移动的节点
        else if (moved) {
        // j < 0 => 最长递增子序列已经查找完，剩下节点全部需要移动
          if (j < 0 || i !== increasingNewIndexSequence[j]) {
            // console.log('移动位置')
            hostInsert(nextChild.el, container, anchor)
          }
          else {
            j--
          }
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
    if (!n1)
      mountComponent(n2, container, parentComponent, anchor)
    else
      updateComponent(n1, n2)
  }

  function updateComponent(n1: any, n2: any) {
    const instance = n2.component = n1.component
    if (shouldUpdateComponent(n1, n2)) {
      instance.next = n2 // 保存下一次更新的虚拟节点
      instance.update()
    }
    else {
      // 不需要更新
      n2.el = n1.el
      instance.vnode = n2
    }
  }

  function mountComponent(initialVNode: any, container: any, parentComponent: any, anchor: any) {
  // 根据 vnode 创建组件实例
    const instance = (initialVNode.component = createComponentInstance(initialVNode, parentComponent))

    // 初始化组件实例
    setupComponent(instance)
    // 进行 render
    setupRenderEffect(instance, initialVNode, container, anchor)
  }

  function setupRenderEffect(instance: any, initialVNode: any, container: any, anchor: any) {
    instance.update = effect(
      () => {
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
          const { next, vnode } = instance
          if (next) {
            next.el = vnode.el
            updateComponentPreRender(instance, next)
          }

          const { proxy } = instance
          const subTree = instance.render.apply(proxy)
          const prevSubTree = instance.subTree
          instance.subTree = subTree // 更新 subTree

          patch(prevSubTree, subTree, container, instance, anchor)
        }
      },
      {
        scheduler() {
          queueJobs(instance.update)
        },
      })
  }

  // 更新 vnode 和 组件属性/插槽等
  function updateComponentPreRender(instance: any, nextVNode: any) {
    instance.vnode = nextVNode
    instance.next = null

    instance.props = nextVNode.props
  }

  return {
    createApp: createAppAPI(render),
  }
}

function getSequence(arr: any[]) {
  const p = arr.slice()
  const result = [0]
  let i, j, u, v, c
  const len = arr.length
  for (i = 0; i < len; i++) {
    const arrI = arr[i]
    if (arrI !== 0) {
      j = result[result.length - 1]
      if (arr[j] < arrI) {
        p[i] = j
        result.push(i)
        continue
      }
      u = 0
      v = result.length - 1
      while (u < v) {
        c = (u + v) >> 1
        if (arr[result[c]] < arrI)
          u = c + 1

        else
          v = c
      }
      if (arrI < arr[result[u]]) {
        if (u > 0)
          p[i] = result[u - 1]

        result[u] = i
      }
    }
  }
  u = result.length
  v = result[u - 1]
  while (u-- > 0) {
    result[u] = v
    v = p[v]
  }
  return result
}
