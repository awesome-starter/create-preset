/**
 * Get Download URL
 * @param {string} variant - The selected variant's name from CMD
 * @param {array} variants - The `variants` in `framework` from config
 * @returns The repo url about selected template starter
 */
module.exports = function ({ variant, variants }) {
  if (!Array.isArray(variants)) return ''

  const target = variants.find((v) => v.name === variant)
  if (!target) return ''

  const repo = target.repo ? String(target.repo) : ''
  if (!repo.startsWith('http')) return ''

  // Use speed up service for GitHub
  const url = repo.includes('github.com/')
    ? repo.replace(/https:\/\/github.com\//, 'hub.fastgit.org:')
    : repo

  return url
}
