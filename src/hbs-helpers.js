const Handlebars = require('handlebars');
/**
 * myfview's Handlebars helpers.
 * @module
 * @param {globalThis.Handlebars} hbs Handlebars. This will get the helpers attached to it.
 */
module.exports = function hbs$helpers(hbs) {
    /** The handlebars helper `nlsp` (i.e. newline space).
     * Useful to add indentation for the CLI mode. */
    hbs.registerHelper("nlsp", function (spaces, content) {
        return content.replace("\n", "\n" + (" ".repeat(spaces)))
    })
    /** The handlebars helper `chalk`.
     * Useful to add colors to the CLI mode. */
    hbs.registerHelper("chalk", function (cholor, content) {
        try { return chalk[cholor](content) }
        catch (e) { myf$debug.extend("hbs:chalk")("Error: %O", e); return "" }
    })
    /** The handlebars helper `wrap`.
     * Useful to limit the length of terminal
     * lines in CLI mode. */
    hbs.registerHelper("wrap", function (width, str) {
        return ww(str, { width, indent: `` })
    })
    /** The handlebars helper `cond`.
     * Improve the logic system.
     * @example hbs
     * {{#if cond flag '||' otherflag}}
     */
    hbs.registerHelper('cond', function (v1, operator, v2) {
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