const { override, fixBabelImports, addLessLoader, addWebpackPlugin } = require('customize-cra')
const AntdDayjsWebpackPlugin = require('antd-dayjs-webpack-plugin')
// const rewireCompressionPlugin = require('react-app-rewire-compression-plugin')
// const rewireUglifyjs = require('react-app-rewire-uglifyjs')

module.exports = override(
    fixBabelImports('import', {
        libraryName: 'antd',
        libraryDirectory: 'es',
        style: true
    }),
    addLessLoader({
        javascriptEnabled: true,
        // modifyVars: {
        //     '@border-radius-base': 0
        // },
    }),
    addWebpackPlugin(new AntdDayjsWebpackPlugin()),
    (config) => {
        config.module.rules.push({
            loader: 'webpack-ant-icon-loader',
            enforce: 'pre',
            include: [
                require.resolve('@ant-design/icons/lib/dist')
            ]
        })
        config.devtool = false
        return config
    },
    // rewireCompressionPlugin,
    // rewireUglifyjs
)