/**
 * The action for `init` command
 * @param targetDirFromCMD - The dir name from CMD, if there is input
 */
export default function init(
  targetDirFromCMD: string | undefined
): Promise<void>
