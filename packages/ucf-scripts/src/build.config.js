/* Build Webpack4 config
 * @Author: Kvkens(yueming@yonyou.com)
 * @Date:   2019-01-22 14:57:43
 * @Last Modified by:   Kvkens
 * @Last Modified time: 2019-01-22 14:57:50
 */

const glob = require('glob');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const merge = require('webpack-merge');
const argv = require("minimist")(process.argv.slice(2));
const commands = argv;
const util = require('./util');
const base = require('./base.config');
const cfg = util.getUcfConfig()('production', commands._);


//当前应用模式
//入口集合
const entries = {};
//HTML插件
const HtmlPlugin = [];
//启动器控制
const _bootList = new Set();

const bootList = cfg.bootList ? cfg.bootList : true;

//构造模块加载入口以及html出口
glob.sync('./ucf-apps/*/src/app.js').forEach(_path => {
    //模块名
    const module = `${_path.split('./ucf-apps/')[1].split('/src/app.js')[0]}`;
    const chunk = `${module}/index`;
    const htmlConf = {
        filename: `${chunk}.html`,
        template: `${_path.split('/app.js')[0]}/index.html`,
        inject: 'body',
        chunks: [chunk],
        hash: true
    };
    //处理启动器逻辑
    if (bootList && typeof bootList == 'boolean') {
        entries[chunk] = _path;
        HtmlPlugin.push(new HtmlWebPackPlugin(htmlConf));
    } else if (Array.isArray(bootList) && bootList.length > 0) {
        bootList.forEach(item => {
            _bootList.add(item);
        });
        if (_bootList.has(module)) {
            entries[chunk] = _path;
            HtmlPlugin.push(new HtmlWebPackPlugin(htmlConf));
        }
    }
});

//默认的配置用于merge操作
const config = {
    mode: 'production',
    devtool: cfg.source_map && 'source-map',
    externals: cfg.externals,
    resolve: {
        alias: cfg.alias
    },
    module: {
        rules: cfg.loader
    },
    optimization: {
        minimizer: [
            new UglifyJsPlugin({
                test: /\.js(\?.*)?$/i,
                cache: '.cache',
                parallel: true,
                sourceMap: cfg.source_map && cfg.source_map // set to true if you want JS source maps
            }),
            new OptimizeCSSAssetsPlugin({})
        ]
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        ...HtmlPlugin
    ]
}
//入口
config.entry = entries;

//环境变量注入
cfg.global_env && (config.plugins = config.plugins.concat(new webpack.DefinePlugin(cfg.global_env)));
//传入插件设置
cfg.buildPlugins && (config.plugins = config.plugins.concat(cfg.buildPlugins));


module.exports = merge(base, config);
