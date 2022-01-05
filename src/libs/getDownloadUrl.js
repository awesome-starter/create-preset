/**
 * Get Download URL
 *
 * @typedef { import('../types').VariantItem } VariantItem
 * @param {{ template: string; variants: VariantItem[] }} options - The result from CMD
 *  - template: The selected template name from CMD
 *  - variants: The `variants` in `framework` from config
 * @returns {string} The repo url about selected template starter
 */
module.exports = function ({ template, variants }) {
  if (!Array.isArray(variants)) return ''

  const target = variants.find((v) => v.name === template)
  if (!target) return ''

  const repo = target.repo ? String(target.repo) : ''
  if (!repo.startsWith('http')) return ''

  // Use speed up service for GitHub
  const url = repo.includes('github.com/')
    ? repo.replace(/https:\/\/github.com\//, 'hub.fastgit.org:')
    : repo

  return url
}
