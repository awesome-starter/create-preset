import escapeRegExp from 'lodash.escaperegexp'
import pkg from '../package.json'

const deps: string = Object.keys(pkg.dependencies)
  .map((name) => escapeRegExp(name))
  .join('|')
const regexp: RegExp = new RegExp(`^(${deps})(/.+)?$`)

export default regexp
