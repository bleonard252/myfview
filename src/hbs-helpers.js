const Handlebars = require('handlebars');
/**
 * myfview's Handlebars helpers.
 * 
 * Use them like the following:
 * ```handlebars
 * {{name param1 param2}}
 * ```
 * @module
 * @param {globalThis.Handlebars} hbs Handlebars. This will get the helpers attached to it.
 */
module.exports = function hbs$helpers(hbs) {
    hbs.registerHelper("nlsp", 
    /** The handlebars helper `nlsp` (i.e. newline space).
     * Useful to add indentation for the CLI mode. */
    function nlsp(spaces, content) {
        return content.replace("\n", "\n" + (" ".repeat(spaces)))
    })
    hbs.registerHelper("chalk", 
    /** The handlebars helper `chalk`.
     * Useful to add colors to the CLI mode. */
    function chalk(cholor, content) {
        try { return chalk[cholor](content) }
        catch (e) { myf$debug.extend("hbs:chalk")("Error: %O", e); return "" }
    })
    hbs.registerHelper("wrap", 
    /** The handlebars helper `wrap`.
     * Useful to limit the length of terminal
     * lines in CLI mode. */
    function wrap(width, str) {
        return ww(str, { width, indent: `` })
    })
    hbs.registerHelper('cond', 
    /** The handlebars helper `cond`.
     * Improve the logic system.
     * @example hbs
     * {{#if cond flag '||' otherflag}}
     */
    function cond(v1, operator, v2) {
        switch (operator) {
            case '==':
                return (v1 == v2) ? true : false;
            case '===':
                return (v1 === v2) ? true : false;
            case '!=':
                return (v1 != v2) ? true : false;
            case '!==':
                return (v1 !== v2) ? true : false;
            case '<':
                return (v1 < v2) ? true : false;
            case '<=':
                return (v1 <= v2) ? true : false;
            case '>':
                return (v1 > v2) ? true : false;
            case '>=':
                return (v1 >= v2) ? true : false;
            case '&&':
                return (v1 && v2) ? true : false;
            case '||':
                return (v1 || v2) ? true : false;
            default:
                return false
        }
    });
    return hbs
}