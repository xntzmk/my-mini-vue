import { hasOwn } from '../shared/index'

const publicPropertiesMap = {
  $el: (i: any) => i.vnode.el,
  $slots: (i: any) => i.slots,
}

export const PublicInstanceProxyHandlers = {
  get({ _: instance }: any, key: any) {
    const { setupState, props } = instance

    if (hasOwn(setupState, key))
      return setupState[key]
    else if (hasOwn(props, key))
      return props[key]

    const publicGetter = publicPropertiesMap[key]
    if (publicGetter)
      return publicGetter(instance)
  },
}
