const nunjucks = require('nunjucks');
const $chalk = require('chalk');
const mark = require('markdown-it');
const ww = require('word-wrap');
const myf$debug = require('debug')('myfview');

var md = mark({linkify: true, html: false});
md.block.ruler.__rules__.forEach(function(x){md.disable(x.name)}); //disable all the built-in blocks
/**
 * myfview's Nunjucks filters.
 * 
 * Use them like the following:
 * ```nunjucks
 * {{content | filter(params...)}}
 * ```
 * @module
 * @param {nunjucks.Environment} njk The Nunjucks module. This will get the filters attached to it.
 */
module.exports = function njk$filters(njk) {
    /** The Nunjucks filter `nlsp` (i.e. newline space).
     * Useful to add indentation for the CLI mode. 
     * @param {int} spaces The number of spaces to indent each newline.
     * @param {string} content What to apply the indentation to. */
    function nlsp(content, spaces) {
        return content.replace(/(\r\n|\r|\n)/g, "$1" + (" ".repeat(spaces)))
    }
    /** The Nunjucks filter `chalk`.
     * Useful to add colors to the CLI mode. 
     * @param {string} cholor The color or formatting to apply.
     * @param {string} content What to apply the formatting to. */
    function chalk(content, cholor) {
        try { return $chalk[cholor](content) }
        catch (e) { myf$debug.extend("njk:chalk")("Error: %O", e); return "" }
    }
    /** The Nunjucks filter `wrap`.
     * Useful to limit the length of terminal
     * lines in CLI mode. 
     * @param {Number} width The maximum size for each line. 
     * @param {string} str What to apply the wrapping to. */
    function wrap(str, width) {
        return ww(str, { width, indent: `` })
    }
    /*** The Nunjucks filter `cond`.
     * Improve the logic system.
     * @param {*} v1 One boolean value or condition.
     * @param {'=='|'==='|'!='|'!=='|'<'|'<='|'>'|'>='|'&&'|'||'} operator The operation to apply.
     * @param {*} v2 Another boolean value or condition. * /
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
    }*/ // Nunjucks has this built in now!
    /**
     * Convert a Markdown inline string to HTML.
     * @param {string} content The content to convert.
     */
    function markdown(content) {
        return md.renderInline(content);
    }
    /** Convert a Markdown link to text or keep the original.
     * The string must include exactly one Markdown link;
     * otherwise it will be returned as-is.
     * @param {string} content The content to convert.
     */
    function linksplit(content) {
        if (content.startsWith("[") && content.endsWith(")") && content.match(/\]\(/).length == 1) {
            let x = content.substr(1, content.length - 2);
            x = x.replace('](', ': ');
            return x
        } else return content
    }
    njk.addFilter("nlsp", nlsp);
    njk.addFilter("chalk", chalk);
    njk.addFilter("wrap", wrap);
    //njk.addFilter("cond", cond);
    njk.addFilter("md", markdown);
    njk.addFilter("linksplit", linksplit);
    return njk
}