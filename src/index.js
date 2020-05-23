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
var njk = require('nunjucks');
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
    /** The function used for rendering to HTML, 
     * or null to use the built-in Nunjucks renderer. 
     * Passed the Myfile JSON object, and should
     * return HTML string.
     * @type {function(object)} */
    "renderHTML": null,
    /** The function used for rendering to cURL, 
     * or null to use the built-in Nunjucks renderer. 
     * Passed the Myfile JSON object, and should
     * return CLI string.
     * @type {function(object)} */
    "renderCLI": null,
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
    /** Whether to watch the configuration file
     * and Nunjuks templates. This lets you update
     * the files while the server is running. If
     * you have a lot of templates, you may want
     * to set this to false. Defaults to true.
     * 
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
            config = defaults(_config || {}, defconf);
            // Update things that need to be updated with the config
            njk.configure(config.templatesPath);
            myf$debug("Myfile config updated");
        } else if (ev == "rename") {
            myf$debug("WARNING: the config was moved or renamed! I'm not updating this file anymore!");
            configwatch.close();
        }
    });
    //DONE: port the helpers to Nunjucks
    njk = njk.configure(config.templatesPath, {watch: config.watchme})
    njk = require('./njk-helpers')(njk);
    if (options.renderHTML == null) options.renderHTML = function(prof) {return njk.render("html.njk", prof)}
    if (options.renderCLI == null) options.renderCLI = function(prof) {return njk.render("cli.njk", prof)}

    //TODO: maybe move some of these functions to other files, for readability purposes
    /**
     * Lookup a Myfile locally (i.e. on this server).
     * @param {string} name The Myfile username to look up.
     * @returns {string} The Myfile data (as a JSON object), or `null` if it doesn't exist.
     */
    function myf$lookup(name) {
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

            "curl": "cli", //DONE: changed this from json to cli
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
        if (u.startsWith("curl/")) return types["curl"];
        let acc = a.accepts(["html", "json"]);
        /* */if (acc == "html") return "html";
        else if (acc == "json") return "json";
//      else if (acc == "????") return "that new format that's 10x more based than anything we have"

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
                res.send(options.renderHTML({...prof,
                    /** @name render_extensions
                     * @description These are additions to the profile object passed to the renderer.
                     * They are used to format information that is otherwise difficult to show, or
                     * give hints to the renderer about how to render the page.
                     * 
                     * The HTML template is `html.njk` and the CLI template is `cli.njk`.
                     * 
                     * @namespace
                     * @global
                     */
                    /** The display name of the user. This is the given name if it's available,
                     * then the username (in the URL) if it's not, then "No display name".
                     * 
                     * Available in the HTML and CLI templates.
                     * @type {string}
                     * @memberof render_extensions */
                    _displayname: prof['name'] || user || "No display name",
                    /** The username of the user, as it appears in the filename and URL.
                     * 
                     * Available in the HTML and CLI templates.
                     * @type {string}
                     * @memberof render_extensions */
                    _username: user || "",
                    /** Hints to the renderer to use dark mode. This may be deprecated in a future
                     * release to enable support for prefers-color-scheme.
                     * 
                     * Only available for the HTML template.
                     * @type {boolean}
                     * @memberof render_extensions */
                    _darkflag: config.forcedark || (req.query.dark === '') || (req.query.theme == 'dark') || false
                })); 
                //Protip: you can add more key-value pairs to the object above!
                //        i.e. {...prof, _privatething: "value"}
                //        This allows extensions!
            } else if (rt == "cli") {
                res.type("text/plain");
                //myf$debug("%o",req.query.nc);
                res.send(options.renderCLI({...prof, 
                    /** The no-color flag. If this is present, hide colors.
                     * 
                     * Only available for the CLI template.
                     * @type {boolean}
                     * @memberof render_extensions */
                    _nc: (req.query.nc === '' ? true : false) || (req.query.nocolor === '' ? true : false),
                    // _displayname and _username are already documented in HTML
                    _username: user || "",
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
