// Invoked on the commit-msg git hook by yorkie.

const { bgRed, red, green, white } = require('kolorist')
const msgPath = process.env.GIT_PARAMS
const msg = require('fs').readFileSync(msgPath, 'utf-8').trim()

const commitRE =
  /^(revert: )?(feat|fix|docs|dx|style|refactor|perf|test|workflow|build|ci|chore|types|wip|release)(\(.+\))?: .{1,50}/

if (!commitRE.test(msg)) {
  console.log()
  console.error(
    `  ${bgRed(white(' ERROR '))} ${red(
      `invalid commit message format.`
    )}\n\n` +
      red(
        `  Proper commit message format is required for automated changelog generation. Examples:\n\n`
      ) +
      `    ${green(`feat(compiler): add 'comments' option`)}\n` +
      `    ${green(`fix(v-model): handle events on blur (close #28)`)}\n\n` +
      red(`  See .github/commit-convention.md for more details.\n`)
  )
  process.exit(1)
}
