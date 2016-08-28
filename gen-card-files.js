const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const unidecode = require('unidecode');
const _ = require('lodash');

const sets = require('./AllSets-x.json');

class FileWriter {
    constructor() {
        this.isWriting = false;
        this.queue = [];
        this.all = fs.openSync(path.join('cards', 'all.txt'), 'w');
    }

    add(name, text) {
        this.queue.push({ name, text });
        if (!this.isWriting) {
            this.isWriting = true;
            this.writeNext();
        }
    }

    writeNext() {
        const next = this.queue.shift();
        const name = toAscii(next.name.replace(/:|"| /g, '_'));
        const fd = fs.openSync(name, 'w');
        fs.write(fd, next.text, err => {
            if (err) {
                console.log(err);
            } else {
                fs.closeSync(fd);
                if (this.queue.length > 0) {
                    this.writeNext();
                } else {
                    this.isWriting = false;
                }
            }
        });
        fs.write(this.all, next.text, err => {
            if (err) {
                console.log(err);
            }
        });
    }

    closeAll() {
        let iid = setInterval(() => {
            if (!this.isWriting) {
                fs.closeSync(this.all);
                clearTimeout(iid);
            }
        }, 500);
    }
}

const writer = new FileWriter();

processSets();

function processSets() {
    const setNames = _.shuffle(Object.keys(sets));
    for (let setName of setNames) {
        const set = sets[setName];

        mkdirp(path.join('cards', set.code), err => {
            if (err) {
                console.log(err);
            } else {
                processSet(set);
            }
        });
    }
}

function processSet(set) {
    const cardIndexes = _.shuffle(_.range(set.cards.length));
    for (let i of cardIndexes) {
        const card = set.cards[i];
        if (!shouldProcess(card)) continue;

        const fullText = genFullText(card);
        const fileName = path.join('cards', set.code, card.name + '.txt');

        writer.add(fileName, fullText);
    }
}

function toAscii(s) {
    const CAPITAL_AE = new RegExp('\u00c6', 'g');

    return unidecode(s.replace(CAPITAL_AE, 'Ae'));
}

function shouldProcess(card) {
    if (card.legalities &&
        card.legalities.some(l => l.format === 'Un-Sets')) {
        return false;
    }

    if (/Basic|Conspiracy|Vanguard|Plane(?!swalker)|Scheme|Phenomenon/.test(card.type)) {
        return false;
    }

    return true;
}

function genFullText(card) {
    card.fullText = toAscii(card.name);
    if (card.manaCost) {
        card.fullText += ' ' + card.manaCost;
    }
    card.fullText += '\n';

    // type line
    if (!card.manaCost && card.colors) {
        card.fullText += '(' + card.colors.join('/') + ') ';
    }
    card.fullText += toAscii(card.type) + '\n';

    // text body
    if (card.text) {
        card.fullText += toAscii(card.text) + '\n';
    }
    if (card.flavor) {
        const flavorLines = toAscii(card.flavor).split('\n');
        card.fullText += flavorLines.map(l => '>' + l).join('\n') + '\n';
    }

    // power/toughness or loyalty
    if (card.types.indexOf('Creature') >= 0) {
        card.fullText += card.power + '/' + card.toughness + '\n';
    } else if (card.types.indexOf('Planeswalker') >= 0) {
        card.fullText += 'Loyalty: ' + card.loyalty + '\n';
    }
    
    card.fullText += '\n';

    return card.fullText;
}

