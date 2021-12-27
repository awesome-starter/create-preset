import { defineConfig } from 'vite'
import path from 'path'
import vue from '@vitejs/plugin-vue'
import components from 'unplugin-vue-components/vite'
import banner from 'vite-plugin-banner'
import pkg from './package.json'
const resolve = (dir: string): string => path.resolve(__dirname, dir)

// https://vitejs.dev/config/
export default defineConfig({
  /**
   * 如果生产部署和开发路径不一样，可以在这里动态配置
   * @see https://cn.vitejs.dev/config/#base
   */
  base: '/',

  /**
   * 本地开发服务，也可以配置接口代理
   * @see https://cn.vitejs.dev/config/#server-proxy
   */
  server: {
    port: 3000,
    // proxy: {
    //   '/devapi': {
    //     target: 'http://192.168.10.198',
    //     changeOrigin: true,
    //     rewrite: (path) => path.replace(/^\/devapi/, ''),
    //   },
    // },
  },

  // build: {
  //   rollupOptions: {
  //     /**
  //      * 如果要对比较大的组件库打包单独的 chunk，可以在这里配置
  //      * @see https://rollupjs.org/guide/en/#outputmanualchunks
  //      */
  //     output: {
  //       // 其中一种方式
  //       manualChunks: {
  //         'ant-design-vue': ['ant-design-vue'],
  //         '@icon-park': ['@icon-park/vue-next'],
  //       },

  //       // 另外一种方式
  //       // manualChunks(id) {
  //       //   if (id.includes('node_modules')) {
  //       //     return id
  //       //       .toString()
  //       //       .split('node_modules/')[1]
  //       //       .split('/')[0]
  //       //       .toString()
  //       //   }
  //       // },
  //     },
  //   },
  // },

  resolve: {
    /**
     * 配置目录别名
     * @see https://cn.vitejs.dev/config/#resolve-alias
     */
    alias: {
      // 兼容webpack的习惯
      '@': resolve('src'),
      '@img': resolve('src/assets/img'),
      '@less': resolve('src/assets/less'),
      '@libs': resolve('src/libs'),
      '@cp': resolve('src/components'),
      '@views': resolve('src/views'),
      // 兼容webpack的静态资源
      '~@': resolve('src'),
      '~@img': resolve('src/assets/img'),
      '~@less': resolve('src/assets/less'),
      '~@libs': resolve('src/libs'),
      '~@cp': resolve('src/components'),
      '~@views': resolve('src/views'),
    },
  },

  css: {
    /**
     * 包括 vw / rem 单位转换等
     * @see https://cn.vitejs.dev/config/#css-postcss
     */
    // postcss: {
    //   plugins: [
    //     // 使用 postcss-px2rem
    //     // px2rem({
    //     //   remUnit: 75,
    //     // }),

    //     // 使用 postcss-px-to-viewport
    //     // px2vw({
    //     //   viewportWidth: 375,
    //     //   minPixelValue: 1,
    //     // }),
    //   ],
    // },

    /**
     * 预处理器选项可以在这里配置
     * @see https://cn.vitejs.dev/config/#css-preprocessoroptions
     */
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
        modifyVars: {
          'primary-color': '#1890ff',
          hack: `true; @import '@less/config.less'`,
        },
      },
    },
  },

  plugins: [
    vue(),

    /**
     * 自动导入组件，不用每次都 import
     * @see https://github.com/antfu/unplugin-vue-components#configuration
     */
    components({
      dirs: [resolve('src/components')],
      extensions: ['vue', 'ts'],
      deep: true,
      dts: false,
    }),

    /**
     * 版权注释
     * @see https://github.com/chengpeiquan/vite-plugin-banner#advanced-usage
     */
    banner(
      `/**\n * name: ${pkg.name}\n * version: v${pkg.version}\n * description: v${pkg.description}\n * author: ${pkg.author}\n */`
    ),
  ],
})
