var fs = require('fs');
var lunr = require('./lunr.min.js');
var indexFile = process.argv[2];
var outputIndexFile = process.argv[3]
var searchData = JSON.parse(fs.readFileSync(indexFile, 'utf8'));

lunr.tokenizer.seperator = /[\s\-\.]+/;
var lunrIndex = lunr(function () {
    this.ref('href');
    this.field('title', { boost: 50 });
    this.field('keywords', { boost: 20 });
    for (var prop in searchData) {
        if (searchData.hasOwnProperty(prop)) {
            this.add(searchData[prop]);
        }
    }
});

fs.writeFileSync(outputIndexFile, JSON.stringify(lunrIndex));