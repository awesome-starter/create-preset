const fs = require('fs')
const { resolve } = require('path')

/**
 * Write file content
 *
 * @param {string} file - The full path of the target file
 * @param {string} content - The content of the file to be written
 */
function write(file, content) {
  if (content) {
    fs.writeFileSync(file, content)
  }
}

/**
 * Remove file or directory
 *
 * @param {string} type - Remove type, support `file` and `dir`
 * @param {string} target - The target to be remove, a file or a directory
 */
function remove(type, target) {
  try {
    switch (type) {
      case 'file':
        fs.unlinkSync(target)
        break
      case 'dir':
        fs.rmdirSync(target)
        break
    }
  } catch (e) {
    // console.log(e)
  }
}

/**
 * Copy a file or a directory
 *
 * @param {string} src - The source file or directory
 * @param {string} dest - The target file or directory
 */
function copy(src, dest) {
  const stat = fs.statSync(src)
  if (stat.isDirectory()) {
    copyDir(src, dest)
  } else {
    fs.copyFileSync(src, dest)
  }
}

/**
 * Copy directory
 *
 * @param {string} srcDir - The source directory
 * @param {string} destDir - The target directory
 */
function copyDir(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true })
  for (const file of fs.readdirSync(srcDir)) {
    const srcFile = resolve(srcDir, file)
    const destFile = resolve(destDir, file)
    copy(srcFile, destFile)
  }
}

/**
 * Check the directory is empty
 *
 * @param {string} path - The target directory full path
 * @returns {boolean} result:
 *  true: empty
 *  false: not empty
 */
function isEmpty(path) {
  return fs.readdirSync(path).length === 0
}

/**
 * Empty the target directory
 *
 * @param {string} dir - The target directory full path
 */
function emptyDir(dir) {
  if (!fs.existsSync(dir)) {
    return
  }
  for (const file of fs.readdirSync(dir)) {
    const abs = resolve(dir, file)
    // baseline is Node 12 so can't use rmSync :(
    if (fs.lstatSync(abs).isDirectory()) {
      emptyDir(abs)
      fs.rmdirSync(abs)
    } else {
      fs.unlinkSync(abs)
    }
  }
}

module.exports = {
  write,
  remove,
  copy,
  copyDir,
  emptyDir,
  isEmpty,
}
