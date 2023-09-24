export function transform(root: any, options: any = {}) {
  const context = createTransformContext(root, options)

  // 深度优先遍历
  traverseNode(root, context)

  createRootCodegen(root)
}

function createTransformContext(root: any, options: any) {
  return {
    root,
    nodeTransforms: options.nodeTransforms || [],
  }
}

// 基于 codegenNode 通过 codegen 生成代码
function createRootCodegen(root: any) {
  root.codegenNode = root.children[0]
}

function traverseNode(node: any, context: any) {
  const { nodeTransforms } = context
  for (let i = 0; i < nodeTransforms.length; i++) {
    const transform = nodeTransforms[i]
    transform(node)
  }

  traverseChildren(node, context)
}

function traverseChildren(node: any, context: any) {
  const children = node.children

  if (children) {
    for (let i = 0; i < children.length; i++) {
      const node = children[i]
      traverseNode(node, context)
    }
  }
}
