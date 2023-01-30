import chalk from 'chalk'
import figlet from '@withtypes/figlet'

export function welcome(): Promise<void> {
  return new Promise((resolve) => {
    figlet('Create Preset', (err, data) => {
      if (err) {
        resolve()
        return
      }
      console.log()
      console.log(
        '---------------------------------------------------------------'
      )
      console.log(data)
      console.log(
        '                    https://preset.js.org                      '
      )
      console.log(
        '---------------------------------------------------------------'
      )
      console.log()
      console.log()
      resolve()
    })
  })
}

export function showTipsToEnableProxy() {
  console.log(
    chalk.gray(`* If requests are slow, proxy download can be enabled:`)
  )
  console.log(
    chalk.gray(`  1. Run "npm i -g create-preset" to install globally`)
  )
  console.log(
    chalk.gray(`  2. Run "preset proxy on" to turn on proxy downloads`)
  )
  console.log(
    chalk.gray(
      `  3. Run "preset i" to create preset, it should be very fast now`
    )
  )
  console.log()
  console.log()
}
