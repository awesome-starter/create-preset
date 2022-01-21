/**
 * The action for `configure` command
 *
 * @param action - The action to operate local preset
 */
export default function configure({
  cmd,
  filePath,
}: {
  cmd: string
  filePath?: string
}): Promise<void>
