// 提升性能
// 进行或运算: 修改 shapeFlag, 进行与运算: 判断 shapeFlag
export enum ShapeFlags {
  ELEMENT = 1, // 0001
  STATEFUL_COMPONENT = 1 << 1, // 0010
  TEXT_CHILDREN = 1 << 2, // 0100
  ARRAY_CHILDREN = 1 << 3, // 1000
}
