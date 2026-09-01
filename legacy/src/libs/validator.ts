import type { OriginConfigItem } from '@/types'

export function isValidConfig(config: OriginConfigItem) {
  return config.tech && config.name && config.repo
}

export function isValidDownloadUrl(url: string) {
  return url.startsWith('http') || url.startsWith('git')
}
