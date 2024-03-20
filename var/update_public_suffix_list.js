/**
 * Source:
 * https://github.com/grug/extract-tld/blob/733e1829b097082a021d66611f80885785c254ea/scripts/updateTlds.ts
 *
 * MIT License
 *
 * Copyright (c) 2022 Dave Cooper
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

"use strict";
const path = require('node:path');
const fs = require('fs');
const f = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const LIST_URL = 'https://publicsuffix.org/list/public_suffix_list.dat';
async function getData() {
    const response = await f(LIST_URL);
    const data = await response.text();
    return data;
}
async function run() {
    const data = await getData();
    const sections = new RegExp('^//\\s*===BEGIN (ICANN|PRIVATE) DOMAINS===\\s*$');
    const comment = new RegExp('^//.*?');
    const splitter = new RegExp('(\\!|\\*\\.)?(.+)');
    let section;
    const tlds = {};
    const lines = data.split(new RegExp('[\r\n]+'));
    for (let line of lines) {
        line = line.trim();
        if (sections.test(line)) {
            section = sections.exec(line)[1].toLowerCase();
            // Adds the sections "icann" and "private" to the map.
            tlds[section] = {};
            continue;
        }
        if (comment.test(line)) {
            continue;
        }
        if (!splitter.test(line)) {
            continue;
        }
        if (!section) {
            continue;
        }
        line = splitter.exec(line);
        const tld = line[2];
        let level = tld.split('.').length;
        const modifier = line[1];
        if (modifier == '*.') {
            level++;
        }
        if (modifier === '!') {
            level--;
        }
        tlds[section][tld] = level;
    }
    fs.writeFileSync(path.join('.', 'src', 'common', 'data', 'public-suffix-list.json'), JSON.stringify(tlds, null, 2));
}
run();
