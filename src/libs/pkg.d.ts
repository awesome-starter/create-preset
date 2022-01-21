import { PKGFromProgram, PKGFromUserAgent } from '@/types'
/**
 * Get the package info
 *
 * @param curVersion - The current version number
 * @returns The package info
 */
export declare function packageInfo(
  curVersion?: string
): Promise<PKGFromProgram>
/**
 * Check the package name is valid
 *
 * @param projectName - The project folder name
 * @returns isValid
 *  true: valid
 *  false: invalid
 */
export declare function isValidPackageName(projectName: string): boolean
/**
 * Format the package name to valid
 *
 * @param projectName - The project folder name
 * @returns a valid package name
 */
export declare function toValidPackageName(projectName: string): string
/**
 * Get the package infor from userAgent
 *
 * @param userAgent - process.env.npm_config_user_agent
 * @returns package info
 */
export declare function pkgFromUserAgent(
  userAgent: string | undefined
): PKGFromUserAgent | undefined
