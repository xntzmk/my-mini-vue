import { NodeTypes } from '../ast'
import { isText } from '../utils'

export function transformText(node: any) {
  if (node.type === NodeTypes.ELEMENT) {
    return () => {
      // 生成 compound 复合节点树
      const { children } = node

      let currentContainer // 收集相邻节点
      for (let i = 0; i < children.length; i++) {
        const child = children[i]

        if (isText(child)) {
        // 查看下一个节点是否为Text
          for (let j = i + 1; j < children.length; j++) {
            const next = children[j]
            if (isText(next)) {
              if (!currentContainer) {
                currentContainer = children[i] = {
                  type: NodeTypes.COMPOUND_EXPRESSION,
                  children: [child],
                }
              }

              currentContainer.children.push(' + ')
              currentContainer.children.push(next)
              // 放入节点后删除该节点
              children.splice(j, 1)
              // 删除节点后 j 需要前移
              j--
            }
            else {
              currentContainer = undefined
              break
            }
          }
        }
      }
    }
  }
}
