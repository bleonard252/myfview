const express = require('express')
const ARG = require('arg')
const app = express()
const xpware = require('./src') //the middleware is exposed from index.js
var args = ARG({
	'--port': Number,
	'--help': Boolean,

	// Aliases
	'-p': '--port',
	'-h': '--help',
});
const port = args.port || process.env.port || 3000

//app.get('/', (req, res) => res.send('Hello World!'))
app.use(xpware({})) //TODO: add config

if (require.main === module) app.listen(port, () => console.log(`[index.js GOOD] listening on port ${port}`))

module.exports = xpware;
