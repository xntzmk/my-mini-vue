import { h } from '../h'

export function renderSlots(slots: any, slotsName: string) {
  const slot = slots[slotsName]
  if (slot)
    return h('div', {}, slot)
}
