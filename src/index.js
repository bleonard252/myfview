var defaults = require('defaults');
const fs = require('fs');
const myf$debug = require('debug')('myfview');
const express = require('express'); //typing

const defopts = {
    /** Path where the Myfiles are stored, sometimes myfview-config/myfiles/ */
    "profilePath": process.cwd()+"/myfview-config/myfiles/",
    "configPath": process.cwd()+"/myfview-config/config.json",
}

module.exports = 
    /**
     * The Myfile Viewer (myfview) middleware. It gets myfiles from
     * the filesystem (maybe databases later) and renders them in
     * various formats, such as HTML, JSON, and text files.
     * @param {defopts} options A set of options to pass to the middleware.
     */
    function myfview(options) {
    options = defaults(options || {}, defopts); //look up
    var config = JSON.parse(fs.readFileSync(options.configPath));
    var configwatch = fs.watch(options.configPath, (ev) => { 
        // Code to update the config when it's... updated
        if (ev == "change") {
            config = JSON.parse(fs.readFileSync(options.configPath))
            myf$debug("Myfile config updated");
        } else if (ev == "rename") {
            myf$debug("WARNING: the config was moved or renamed! I'm not updating this file anymore!");
            configwatch.close();
        }
    });
    /**
     * Lookup a Myfile locally (i.e. on this server).
     * @param {string} name The Myfile username to look up.
     * @returns {Promise<*>} The Myfile data (as a JSON object), or `null` if it doesn't exist.
     */
    function myf$lookup(name) {
        return Promise((resolve,reject) => {
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
        })
    }
    /**
     * Get the style the myfile middleware should use
     * to render the data. 
     * 
     * From `?type={type}` and `?{type}`.
     * @param {string[]} q The query parameters.
     * @param {string|null} t The `type` query parameter. Can be `null`.
     * @param {string} u The `user-agent` header.
     * @param {Function} a The `accept` function from Express.
     * @returns {'html'|'cli'|'json'|'yaml'|'toml'} 
     * The type of rendering to use, as a string.
     * @default "json" 
     * // If ?type exists and doesn't match a type or alias, it'll fall back to JSON instead.
     */
    function myf$getrentype(q,t,u,a) {
        let types = {
            "html": "html",
            "htm": "html",
            "web": "html",
            "gui": "html",
            "json": "json",
            "js": "json",
            "raw": "json",
            "curl": "json", //TODO: change this to cli when it comes
        }
        if (t) return types[t] || "json" // if there's a type, use it or fall back
        for (const p in q) { // if there's a type as a query parameter, use it!
            if (q.hasOwnProperty(p)) { //this was in the snippet
                if (types[p]) return types[p]
            }
        }
        if (u.startsWith("curl/")) return types["curl"];
        let acc = a("html, json");
        /* */if (acc == "html") return "html";
        else if (acc == "json") return "json";

        // and if all else fails...
        return "json"
    }
    /**
     * @param {express.Request} req @param {express.Response} res @param {express.NextFunction} next
     */
    function myf$middleware(req, res, next) {
        if (req.path.startsWith("//")) {
            req.myfuser = req.path.replace(/^\//,"");
            req.rentype = myf$getrentype(req.params, req.query.type, req.header["user-agent"], req.header["accept"], req.accepts);
            let user = req.myfuser;
            let rt = req.rentype;
            if (user != "") let prof = myf$lookup(user+"");
            else let prof = myf$lookup(req.hostname); // i.e. google.com//google.com
            if (rt == "html") {
                //TODO: res.send(Handlebars...)
            } else { // essentially: else if (rt == "json") {
                res.type("json");
                //TODO: config.json
                res.send(prof)
            }
        } else next() // very important so that other things can happen
    }
    return myf$middleware
}
// vim: ts=8:sts=0:et:sw=4:smarttab
