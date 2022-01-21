import {
  TechConfig,
  TechStackItem,
  OriginConfigItem,
  ConfigItem,
} from '@/types'
/**
 * Get the list of supported tech stacks
 * @returns Tech list
 */
export declare function fetchTechConfig(): Promise<TechConfig[]>
/**
 * Get the basic tech stack config, without variants
 * @returns The tech stack config without variants
 */
export declare function getTechStacks(): Promise<TechStackItem[]>
/**
 * Handle origin config item to be config item
 *
 * @param fileName - The config file name
 * @param originConfig - The origin config
 * @returns The config array from root config file
 */
export declare function handleOriginConfig(
  fileName: string,
  originConfig: OriginConfigItem[]
): Promise<ConfigItem[]>
/**
 * Read config file
 *
 * @param fileName - The config file name
 * @returns The config array from root config file
 */
export declare function readConfigFile(fileName: string): Promise<ConfigItem[]>
/**
 * Fetch config file from CDN
 * @param fileName - The config file name
 * @returns The config array from root config file
 */
export declare function fetchConfigFile(fileName: string): Promise<ConfigItem[]>
/**
 * Get config
 * @returns Config
 */
export declare function getConfig(): Promise<{
  techStacks: TechStackItem[]
  templates: string[]
}>
