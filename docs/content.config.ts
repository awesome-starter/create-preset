import { type DocsContentConfig } from '@blackwork/docs'

export const docsContentConfig = {
  root: 'src/contents',
  defaultLocale: 'en',
  enableDefaultLocaleRedirect: true,
  locales: {
    en: {
      code: 'en',
      lang: 'en-US',
      label: 'English',
    },
    zh: {
      code: 'zh',
      lang: 'zh-CN',
      label: '简体中文',
    },
  },
  sections: {
    showcase: { layout: 'content' },
    guide: {
      layout: 'docs',
      sidebar: [
        {
          type: 'group',
          label: {
            en: 'Start here',
            zh: '开始使用',
          },
          items: [
            {
              type: 'item',
              href: '/guide/getting-started',
              label: {
                en: 'Quickstart',
                zh: '快速开始',
              },
            },
            {
              type: 'item',
              href: '/guide/official-generators',
              label: {
                en: 'Official generators',
                zh: '官方脚手架',
              },
            },
          ],
        },
        {
          type: 'group',
          label: {
            en: 'Configuration reference',
            zh: '配置参考',
          },
          items: [
            {
              type: 'item',
              href: '/guide/private-presets',
              label: {
                en: 'Private presets',
                zh: '私有 Preset',
              },
            },
            {
              type: 'item',
              href: '/guide/preset-configs',
              label: {
                en: 'Preset configs',
                zh: 'Preset 配置',
              },
            },
          ],
        },
        {
          type: 'group',
          label: {
            en: 'Migration',
            zh: '版本迁移',
          },
          items: [
            {
              type: 'item',
              href: '/guide/migration',
              label: {
                en: 'Migration to 1.0',
                zh: '迁移到 1.0',
              },
            },
          ],
        },
      ],
    },
  },
} satisfies DocsContentConfig
