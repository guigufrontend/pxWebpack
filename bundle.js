const webpack = require('./lib/webpack')
const config = require('./webpack.config')

new webpack(config).run()