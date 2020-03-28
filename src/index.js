var defaults = require('defaults');
const fs = require('fs');

module.exports = function (options) {
    options = defaults(options || {},{
        /** Path where the Myfiles are stored, sometimes myfview-config/myfiles/ */
        "profilePath": __dirname+"/myfview-config/myfiles/",
    });
    /**
     * Lookup a Myfile locally (i.e. on this server).
     * @param {string} name The Myfile username to look up.
     * @returns {Promise} The Myfile data, or `null` if it doesn't exist.
     */
    function myf$lookup(name) {
        return Promise((resolve,reject) => {
            fs.readFile(options.profilePath+"/"+name, (err, data) => { // the / is for good measure
                if (!err) {
                    myf = JSON.parse(data.toString());
                    resolve(myf);
                } else if (err.code == "ENOENT") resolve(null)
                else reject(err)
            })
        })
    }
    return function (req, res, next) {
        // Implement the middleware function based on the options object
        next()
    }
}
// vim: ts=8:sts=0:et:sw=4:smarttab
