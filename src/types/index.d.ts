export interface VariantItem {
  name: string
  description: string
  color: any
  repo: string
}

export interface FrameworkItem {
  name: string
  color: any
  variants: VariantItem[]
}
