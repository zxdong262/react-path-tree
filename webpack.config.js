const webpack = require('webpack')
const OpenBrowserPlugin = require('open-browser-webpack-plugin')
const configSys = require('./build/config')
const UnminifiedWebpackPlugin = require('unminified-webpack-plugin')
const pack = require('./package.json')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const extractTextPlugin = new ExtractTextPlugin({
  filename: '[name].min.css'
})

let config = {
  entry: {
    'react-path-tree': ['./src/react-path-tree.jsx'],
    app: './src/index.jsx'
  },
  output: {
    path: __dirname + '/dist/', //输出文件目录
    filename: '[name].bundle.js', //输出文件名
    libraryTarget: 'var',
    publicPath: '/'
  },
  watch: true,
  externals: {
    'react': 'React',
    'react-dom': 'ReactDOM',
    'd3': 'd3',
    'lodash': 'lodash'
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: ['babel-loader']
      },
      {
        test: /\.styl$/,
        exclude: /node_modules/,
        use: ExtractTextPlugin.extract({
          fallbackLoader: 'style-loader',
          loader: 'css-loader!stylus-loader'
        })
      }
    ]
  },
  devtool: '#eval-source-map',
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    extractTextPlugin,
    new OpenBrowserPlugin({ url: 'http://localhost:' + configSys.port })
  ],
  devServer: {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept'
    },
    historyApiFallback: true,
    hot: true,
    inline: true,
    //progress: true,
    //watch: true,
    port: configSys.port,
    proxy: {
      '*': {
        target: 'http://localhost:' + configSys.devServerPort,
        secure: false,
        ws: false,
        bypass: function (req, res, opt) {
          if (
            /(\.json|\.jpg|\.png|\.css)$/.test(req.path) ||
            /\.bundle\.js/.test(req.path)
          ) {
            console.log('bypass', req.path)
            return req.path
          }
        }
      }
    }
  },
}

if (process.env.NODE_ENV === 'production') {

  config.plugins = [
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': "'production'"
      }
    }),
    new webpack.optimize.UglifyJsPlugin({
      mangle: true,
      compress: {
        warnings: false, // Suppress uglification warnings
      }
    }),
    extractTextPlugin,
    new UnminifiedWebpackPlugin(),
    new webpack.BannerPlugin({
      banner:
      `
/**
 * ${pack.name}
 * @version v${pack.version}
 * @link ${pack.homepage}
 * @author ${pack.author.name} (${pack.author.email})
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */
      `,
      raw: true })
  ]

  config.entry = {
    'react-path-tree': ['./src/react-path-tree.jsx']
  },

  config.output = {
    path: __dirname + '/dist/', //output folder
    filename: '[name].min.js', //output name
    libraryTarget: 'umd',
    publicPath: '/',
    library: 'ReactDicisionTree'
  }

  config.externals = {
    react: {
      root: 'React',
      commonjs: 'react',
      commonjs2: 'react',
      amd: 'react'
    },
    'react-dom': {
      root: 'ReactDOM',
      commonjs: 'react-dom',
      commonjs2: 'react-dom',
      amd: 'react-dom'
    }
  }

  config.devtool = 'source-map'

}


module.exports = config