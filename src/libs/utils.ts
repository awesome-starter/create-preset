import { TechConfig, ConfigItem } from '@/types'

type UniqueItem = TechConfig | ConfigItem

/**
 * Unique an array containing objects
 * @param target - The key used to determine if there are duplicate values
 * @param list - The original data list
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

/**
 * Shuffle array sort
 */
export const shuffle = (arr: any[]): any[] => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j: number = Math.floor(Math.random() * (i + 1))
    const item: any = arr[i]
    arr[i] = arr[j]
    arr[j] = item
  }
  return arr
}
