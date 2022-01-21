/**
 * Write file content
 * @param file - The full path of the target file
 * @param content - The content of the file to be written
 */
export declare function write(file: string, content: string): void
/**
 * Remove file or directory
 * @param type - Remove type, support `file` and `dir`
 * @param target - The target to be remove, a file or a directory
 */
export declare function remove(type: string, target: string): void
/**
 * Copy a file or a directory
 * @param src - The source file or directory
 * @param dest - The target file or directory
 */
export declare function copy(src: string, dest: string): void
/**
 * Copy directory
 * @param srcDir - The source directory
 * @param destDir - The target directory
 */
export declare function copyDir(srcDir: string, destDir: string): void
/**
 * Check the directory is empty
 * @param path - The target directory full path
 * @returns result:
 *  true: empty
 *  false: not empty
 */
export declare function isEmpty(path: string): boolean
/**
 * Empty the target directory
 * @param dir - The target directory full path
 */
export declare function emptyDir(dir: string): void
