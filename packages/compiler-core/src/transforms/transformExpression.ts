import { NodeTypes } from '../ast'

export function transformExpression(node: any) {
  if (node.type === NodeTypes.INTERPOLATION)
    processExpression(node.content)
}

function processExpression(node: any) {
  node.content = `_ctx.${node.content}`
}
