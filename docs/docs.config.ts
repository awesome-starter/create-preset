import { defineDocsConfig } from '@blackwork/docs'
import { docsContentConfig } from './content.config'
import { Callout } from './src/mdx/components/callout'
import { DocsFadePreview } from './src/mdx/components/fade-preview'
import { DocsHeaderSearchAction } from './src/search/docs-search'
import { PackageManagerCommands } from './src/mdx/components/package-manager-commands'
import { PresetFooter } from './src/site/footer'

export const docsConfig = defineDocsConfig({
  content: docsContentConfig,
  site: {
    title: 'Create Preset',
    description:
      'Provides the ability to quickly create preset projects.',
    url: 'https://preset.js.org',
  },
  home: {
    badge: {
      alt: { en: 'create-preset on npm', zh: 'create-preset npm 最新版本' },
      href: 'https://www.npmjs.com/package/create-preset',
      src: 'https://img.shields.io/npm/v/create-preset?color=10b981&label=npm',
    },
    eyebrow: false,
    title: 'Create Preset',
    description: {
      en: 'Provides the ability to quickly create preset projects.',
      zh: '提供快速创建预设项目模板的能力。',
    },
    primaryAction: {
      href: '/guide/getting-started',
      label: { en: 'Get Started', zh: '快速开始' },
    },
  },
  mdx: {
    components: {
      Callout,
      FadePreview: DocsFadePreview,
      PackageManagerCommands,
    },
  },
  theme: {
    appearance: 'glass',
    defaultTheme: 'dark',
    labels: {
      changeLanguage: { en: 'Change language', zh: '切换语言' },
      documentPager: { en: 'Document pager', zh: '文档翻页' },
      next: { en: 'Next', zh: '下一篇' },
      previous: { en: 'Previous', zh: '上一篇' },
      openSectionNavigation: { en: 'Open section navigation', zh: '打开章节导航' },
      openSiteNavigation: { en: 'Open site navigation', zh: '打开网站导航' },
      primaryNavigation: { en: 'Primary navigation', zh: '主导航' },
      sections: { en: 'Sections', zh: '章节' },
      scrollToTop: { en: 'Scroll to top', zh: '回到顶部' },
      toggleTheme: { en: 'Toggle theme', zh: '切换主题' },
    },
    toc: {
      title: { en: 'On this page', zh: '本页导航' },
      openLabel: { en: 'Open outline', zh: '打开本页导航' },
    },
    socialLinks: [
      {
        type: 'github',
        link: 'https://github.com/preset-cli/create-preset',
        label: 'GitHub',
        ariaLabel: {
          en: 'Source code on GitHub',
          zh: '在 GitHub 查看源码',
        },
      },
    ],
    nav: [
      {
        href: '/guide/getting-started',
        label: {
          en: 'Guide',
          zh: '指南',
        },
      },
      {
        href: '/guide/preset-configs',
        label: {
          en: 'Preset configs',
          zh: 'Preset 配置',
        },
      },
    ],
  },
  slots: {
    headerActions: DocsHeaderSearchAction,
    footer: PresetFooter,
  },
})
