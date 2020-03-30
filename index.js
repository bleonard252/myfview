const express = require('express')
const ARG = require('arg')
const app = express()
const DEBUG = require('debug')
const debug = DEBUG("app")
const xpware = require('./src') //the middleware is exposed from index.js

//debug.log = console.info.bind(console);

var args = ARG({
	'--port': Number,
	'--help': Boolean,

	// Aliases
	'-p': '--port',
	'-h': '--help',
});
const port = args.port || process.env.port || 3000

//app.get('/', (req, res) => res.send('Hello World!'))
//app.use(DEBUG("app:http"))

app.use(xpware({})) //TODO: add config

if (require.main === module) {
	if (args.help) console.log("myfview [-p, --port=3000] [-h, --help]\nRun a myfile viewer server.");
	else app.listen(port, () => debug(`listening on port ${port}`));
}

module.exports = xpware; //require("myfview") will use the middleware.
// so you can use app.use(require("myfview")({options...}))
