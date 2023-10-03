import { NodeTypes } from './ast'
import { TO_DISPLAY_STRING } from './runtimeHelpers'

export function transform(root: any, options: any = {}) {
  const context = createTransformContext(root, options)

  // 深度优先遍历
  traverseNode(root, context)

  createRootCodegen(root)

  root.helpers = [...context.helpers.keys()]
}

function createTransformContext(root: any, options: any) {
  const context = {
    root,
    nodeTransforms: options.nodeTransforms || [],
    helpers: new Map(), // 需要导入的代码
    helper(key: any) {
      context.helpers.set(key, 1)
    },
  }

  return context
}

// 基于 codegenNode 通过 codegen 生成代码
function createRootCodegen(root: any) {
  const child = root.children[0]
  if (child.type === NodeTypes.ELEMENT)
    root.codegenNode = child.codegenNode
  else
    root.codegenNode = root.children[0]
}

function traverseNode(node: any, context: any) {
  const { nodeTransforms } = context
  const exitFns: any = []
  for (let i = 0; i < nodeTransforms.length; i++) {
    const transform = nodeTransforms[i]
    const onExit = transform(node, context)
    if (onExit)
      exitFns.push(onExit)
  }

  switch (node.type) {
    case NodeTypes.INTERPOLATION:
      context.helper(TO_DISPLAY_STRING)
      break

    case NodeTypes.ROOT:
    case NodeTypes.ELEMENT:
      traverseChildren(node, context)
      break

    default:
      break
  }

  // 倒序执行
  let i = exitFns.length
  while (i--)
    exitFns[i]()
}

function traverseChildren(node: any, context: any) {
  const children = node.children
  for (let i = 0; i < children.length; i++) {
    const node = children[i]
    traverseNode(node, context)
  }
}
