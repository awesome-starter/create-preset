import type { VariantItem } from '@/types'
/**
 * Get Download URL
 * @param options - The result from CMD
 *  - template: The selected template name from CMD
 *  - variants: The `variants` in `techStack` from config
 * @returns {string} The repo url about selected template starter
 */
export declare function getDownloadUrl({
  template,
  variants,
}: {
  template: string
  variants: VariantItem[]
}): string
/**
 * Download GitHub Repo
 *
 * @param options - the download options.
 *  - repo: The repo url to download
 *  - folder: The project folder name
 *  - clone: If true, use `git clone` to download repo
 * @returns The download status:
 *  true: success
 *  false: error
 */
export declare function download({
  repo,
  folder,
  clone,
}: {
  repo: string
  folder: string
  clone?: boolean
}): Promise<boolean>
