/** 
 * The Myfile Viewer (myfview) middleware. It gets myfiles from
 * the filesystem (maybe databases later) and renders them in
 * various formats, such as HTML, JSON, and text files.
 * @module myfview
 */
// The docs are powered by JSDoc
// To use it on this file, run:
// npm run gendoc
var defaults = require('defaults');
const fs = require('fs');
var hbs = require('handlebars');
const chalk = require('chalk');
const ww = require('word-wrap');
const YAML = require('js-yaml');
const TOML = require('@tauri-apps/toml');
const myf$debug = require('debug')('myfview');
const express = require('express'); //typing

/** The (default) options for the middleware.
 * @alias options
 * @namespace
 */
const defopts = {
    /** Path where the Myfiles are stored, sometimes myfview-config/myfiles/ 
     * @type {string} */
    "profilePath": process.cwd()+"/myfview-config/myfiles/",
    /** Filename for the myfview configuration. This file will be watched and loaded. 
     * @type {string} */
    "configPath": process.cwd()+"/myfview-config/config.json",
}
/** The (default) configuration file data for the middleware. 
 * 
 * This should be in the configuration file named by {@link options.configPath}.
 * @alias config
 * @namespace
*/
const defconf = {
    /** Myfile fields to be interpreted as "private;"
     * that is, they are not shown in the following formats:
     * "json", "yaml", "toml"
     * @type {string[]} */
    "privatefields": [],
    /** Whether to watch the configuration file.
     * Only applies on startup. 
     * @type {boolean} */
    "watchme": true,
    /** The path to the templates directory.
     * 
     * **You need to have ALL the templates!**
     * @example
     * "templatesPath": "./myfview-config/templates/"
     */
    "templatesPath": process.cwd()+"/views",
    /** Force dark mode.
     * @type {boolean} */
    "forcedark": false
}

/** The myfview Express middleware function.
 * @param {defopts} options A set of options to pass to the middleware. 
 * NOTE: most of the settings are in {@link config} instead, where
 * they can be modified.
 * @example
 * const myfview = require('myfview'); //somewhere up here
 * // require('express'); and stuff up here too
 * app.use(myfview({ options goes here... }))
 */
module.exports = function myfview(options) {
    options = defaults(options || {}, defopts); //look up
    /** @type {defconf} */
    var config = JSON.parse(fs.readFileSync(options.configPath));
    config = defaults(config || {}, defconf);
    if (config.watchme) var configwatch = fs.watch(options.configPath, (ev) => { 
        // Code to update the config when it's... updated
        if (ev == "change") {
            let _config = JSON.parse(fs.readFileSync(options.configPath))
            config = defaults(config || {}, defconf);
            myf$debug("Myfile config updated");
        } else if (ev == "rename") {
            myf$debug("WARNING: the config was moved or renamed! I'm not updating this file anymore!");
            configwatch.close();
        }
    });
    hbs = require('./hbs-helpers')(hbs); // Register helpers externally
    /** The Handlebars template for profile pages. */
    const hbs$user = hbs.compile(`${fs.readFileSync(config.templatesPath+"/user.hbs").toString()}`)
    /** The Handlebars template for CLI profile pages. */
    const hbs$cli = hbs.compile(`${fs.readFileSync(config.templatesPath+"/cli.hbs").toString()}`)
    //TODO: maybe move some of these functions to other files, for readability purposes
    /**
     * Lookup a Myfile locally (i.e. on this server).
     * @param {string} name The Myfile username to look up.
     * @returns {string} The Myfile data (as a JSON object), or `null` if it doesn't exist.
     */
    function myf$lookup(name) {
        /*return Promise((resolve,reject) => {
            fs.readFile(options.profilePath+"/"+name, (err, data) => { // the / is for good measure
                if (!err) {
                    myf = JSON.parse(data.toString());
                    resolve(myf);
                } else if (err.code == "ENOENT") resolve(null)
                else {
                    myf$debug.extend('lookup()')("Error: %O",err)
                    reject(err)
                }
            })
        })*/
        return require(options.profilePath+"/"+name+".json") // needs .json or it'll freak
    }
    /**
     * Get the style the myfile middleware should use
     * to render the data. 
     * 
     * From `?type={type}` and `?{type}`.
     * @param {string[]} q The query parameters.
     * @param {string|null} t The `type` query parameter. Can be `null`.
     * @param {string} u The `user-agent` header.
     * @param {express.Request} a The `req`uest from Express.
     * @returns {'html'|'cli'|'json'|'yaml'|'toml'} 
     * The type of rendering to use, as a string.
     * @default "json" 
     * // If ?type exists and doesn't match a type or alias, it'll fall back to JSON instead.
     */
    function myf$getrentype(q,t,u,a) {
        //let d = myf$debug.extend("getrentype");
        let d = function(){};
        let types = {
            "html": "html",
            "htm": "html",
            "web": "html",
            "gui": "html",

            "json": "json",
            "js": "json",
            "raw": "json",

            "yaml": "yaml",
            "yml": "yaml",
            "y": "yaml",

            "toml": "toml",
            "tml": "toml",
            "ini": "toml",

            "curl": "cli", //DONE: change this to cli when it comes
            "txt": "cli",
            "text": "cli",
            "cli": "cli",
        }
        d("Type value: %o", t);
        if (t != null && t != undefined) 
            return types[t] || "json" // if there's a type, use it or fall back
        for (const p in q) { // if there's a type as a query parameter, use it!
            if (q.hasOwnProperty(p)) { //this was in the snippet
                if (types[p]) return types[p]
            }
        }
        //d("Query parameters: %o", q);
        if (u.startsWith("curl/")) return types["curl"];
        //d("User agent: %o", u);
        let acc = a.accepts(["html", "json"]);
        //d("Accept: %o", acc);
        /* */if (acc == "html") return "html";
        else if (acc == "json") return "json";

        //d("All else failed! Falling back to json");
        // and if all else fails...
        return "json"
    }
    /**
     * The inner middleware function. 
     * As per Express requirements for middleware, it takes `req`, `res`, and `next`.
     * @param {express.Request} req
     * @param {express.Response} res 
     * @param {express.NextFunction} next
     */
    function myf$middleware(req, res, next) {
        //myf$debug("%o",req.path);
        if (req.path.startsWith("//")) {
            req.myfuser = req.path.replace(/^\/\//,"");
            if (req.myfuser.includes("//")) {
                //DONE: somewhere in here, check if req.myfuser has "//" in it and split it there.
                //NOTE: Before is then the user, and after is then a path to be passed to another
                //      part of the middleware (elsewhere in $PROJECT_ROOT/src/).
                //TODO: Perhaps you could use express.Router to some advantage here?
                let spl = req.myfuser.split("//");
                req.myfuser = spl.shift();
                req.myfpath = spl.join(""); // so, if there are more //s, pass them along
            }
            req.rentype = myf$getrentype(req.query, req.query.type, req.headers["user-agent"], req);
            let user = req.myfuser;
            let rt = req.rentype;
            myf$debug("[lookup] Getting myfile for %s; rendering using %o", user, rt);
            let prof = null;
            if (user != "") prof = myf$lookup(user+"");
            else prof = myf$lookup(req.hostname); // i.e. google.com//google.com
            if (rt == "html") {
                //DONE: res.send(Handlebars...)
                res.send(hbs$user({...prof,
                    _displayname: prof['name'] || user || "No display name",
                    _darkflag: config.forcedark || (req.query.dark === '') || (req.query.theme == 'dark') || false
                })); 
                //Protip: you can add more key-value pairs to the object above!
                //        i.e. {...prof, _privatething: "value"}
                //        This allows access to the Myfile as Handlebars templates
                //        and also enables extensions!
            } else if (rt == "cli") {
                res.type("text/plain");
                //myf$debug("%o",req.query.nc);
                res.send(hbs$cli({...prof, 
                    /** The no-color flag. If this is present, hide colors. */
                    _nc: (req.query.nc === '' ? true : false) || (req.query.nocolor === '' ? true : false),
                    _displayname: prof['name'] || user || "No display name"
                }));
            } else { // essentially: else if (rt == "json") {
                res.type("json");
                let mod = defaults({},prof)
                for (var k in config.privatekeys) {delete mod[k]}
                //TODO: delete by prefix, too
                if (rt == "yaml") res.type("yaml").send(YAML.safeDump(mod));
                if (rt == "toml") res.type("application/toml").send(TOML.stringify(mod));
                if (rt == "yaml" && (req.query.nd || req.query.forcerender)) res.type("txt").send(YAML.safeDump(mod));
                if (rt == "toml" && (req.query.nd || req.query.forcerender)) res.type("txt").send(TOML.stringify(mod));
                //NOTE: using ?y&forcerender will use the wrong MIME type; it'll instead display it as text,
                //      thus forcing it to render.
                else res.send(mod);
            }
        } else next() // very important so that other things can happen
    }
    return myf$middleware
}
// vim: ts=8:sts=0:et:sw=4:smarttab
