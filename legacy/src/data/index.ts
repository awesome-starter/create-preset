import { isProxyOn } from '@/libs/local'

/**
 * Whitelist for conversion shorthand repositories
 * @see https://gitlab.com/flippidippi/download-git-repo#repository
 */
export const whitelist = [
  'https://github.com/',
  'https://gitlab.com/',
  'https://bitbucket.com/',
]

/**
 * If proxy is enabled, the configuration file also points to the mirroring domain name
 */
export function getBaseUrl() {
  return isProxyOn()
    ? 'https://gitee.com/awesome-starter/website/raw/main/docs/public/config'
    : 'https://preset.js.org/config'
}
