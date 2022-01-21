import fs from 'fs'
import { resolve } from 'path'

/**
 * Write file content
 * @param file - The full path of the target file
 * @param content - The content of the file to be written
 */
export function write(file: string, content: string): void {
  if (content) {
    fs.writeFileSync(file, content)
  }
}

/**
 * Remove file or directory
 * @param type - Remove type, support `file` and `dir`
 * @param target - The target to be remove, a file or a directory
 */
export function remove(type: string, target: string): void {
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
 * @param src - The source file or directory
 * @param dest - The target file or directory
 */
export function copy(src: string, dest: string): void {
  const stat = fs.statSync(src)
  if (stat.isDirectory()) {
    copyDir(src, dest)
  } else {
    fs.copyFileSync(src, dest)
  }
}

/**
 * Copy directory
 * @param srcDir - The source directory
 * @param destDir - The target directory
 */
export function copyDir(srcDir: string, destDir: string): void {
  fs.mkdirSync(destDir, {
    recursive: true,
  })

  for (const file of fs.readdirSync(srcDir)) {
    const srcFile = resolve(srcDir, file)
    const destFile = resolve(destDir, file)
    copy(srcFile, destFile)
  }
}

/**
 * Check the directory is empty
 * @param path - The target directory full path
 * @returns result:
 *  true: empty
 *  false: not empty
 */
export function isEmpty(path: string): boolean {
  return fs.readdirSync(path).length === 0
}

/**
 * Empty the target directory
 * @param dir - The target directory full path
 */
export function emptyDir(dir: string): void {
  if (!fs.existsSync(dir)) return
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
