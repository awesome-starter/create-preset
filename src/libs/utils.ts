import { TechConfig, ConfigItem } from '@/types'

type UniqueItem = TechConfig | ConfigItem

/**
 * Unique an array containing objects
 * @returns A unique list
 */
export function unique({
  target,
  list,
}: {
  target: string
  list: UniqueItem[]
}): UniqueItem[] {
  const data: { [key: string]: UniqueItem } = {}
  list.forEach((item) => {
    const key = String(item[target])
    if (data[key]) return
    data[key] = item
  })

  const uniqueList: UniqueItem[] = []
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      uniqueList.push(data[key])
    }
  }

  return uniqueList
}
