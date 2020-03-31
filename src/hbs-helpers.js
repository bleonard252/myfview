const Handlebars = require('handlebars');
const $chalk = require('chalk');
const mark = require('markdown-it');
const ww = require('word-wrap');
const myf$debug = require('debug')('myfview');

var md = mark({linkify: true, html: false});
md.block.ruler.__rules__.forEach(function(x){md.disable(x.name)}); //disable all the built-in blocks
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
    /** The handlebars helper `nlsp` (i.e. newline space).
     * Useful to add indentation for the CLI mode. 
     * @param {int} spaces The number of spaces to indent each newline.
     * @param {string} content What to apply the indentation to. */
    function nlsp(spaces, content) {
        return content.replace(/(\r\n|\r|\n)/g, "$1" + (" ".repeat(spaces)))
    }
    /** The handlebars helper `chalk`.
     * Useful to add colors to the CLI mode. 
     * @param {string} cholor The color or formatting to apply.
     * @param {string} content What to apply the formatting to. */
    function chalk(cholor, content) {
        try { return $chalk[cholor](content) }
        catch (e) { myf$debug.extend("hbs:chalk")("Error: %O", e); return "" }
    }
    /** The handlebars helper `wrap`.
     * Useful to limit the length of terminal
     * lines in CLI mode. 
     * @param {Number} width The maximum size for each line. 
     * @param {string} str What to apply the wrapping to. */
    function wrap(width, str) {
        return ww(str, { width, indent: `` })
    }
    /** The handlebars helper `cond`.
     * Improve the logic system.
     * ```handlebars
     * {{#if cond flag '||' otherflag}}
     * ```
     * @param {*} v1 One boolean value or condition.
     * @param {'=='|'==='|'!='|'!=='|'<'|'<='|'>'|'>='|'&&'|'||'} operator The operation to apply.
     * @param {*} v2 Another boolean value or condition. */
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
    }
    function markdown(content) {
        return md.renderInline(content);
    }
    hbs.registerHelper("nlsp", nlsp);
    hbs.registerHelper("chalk", chalk);
    hbs.registerHelper("wrap", wrap);
    hbs.registerHelper("cond", cond);
    hbs.registerHelper("md", markdown);
    return hbs
}