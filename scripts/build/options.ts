import { escapeRegExp } from '@bassist/utils'
import pkg from '../../package.json'

export function cjsExternalsRegExp() {
  const deps: string = Object.keys(pkg.dependencies)
    .map((name) => escapeRegExp(name))
    .join('|')
  return new RegExp(`^(${deps})(/.+)?$`)
}
