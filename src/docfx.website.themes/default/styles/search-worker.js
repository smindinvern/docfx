(function () {
  importScripts('lunr.min.js');

  var lunrIndex;

  var stopWords = null;
  var searchData = {};
  var searchIndex = null;

  lunr.tokenizer.separator = /[\s\-\.]+/;

  function init(options) {
    lunr.tokenizer.separator = /[\s\-\.]+/;

    var stopWordsRequest = new XMLHttpRequest();
    stopWordsRequest.open('GET', '../search-stopwords.json');
    stopWordsRequest.onload = function () {
      if (this.status != 200) {
        return;
      }
      stopWords = JSON.parse(this.responseText);
      buildIndex(options);
    }
    stopWordsRequest.send();

    var searchDataRequest = new XMLHttpRequest();

    searchDataRequest.open('GET', '../index.json');
    searchDataRequest.onload = function () {
      if (this.status != 200) {
        return;
      }
      searchData = JSON.parse(this.responseText);
      buildIndex(options);
    }
    searchDataRequest.send();

    if (options.prebuildIndex) {
      var searchIndexRequest = new XMLHttpRequest();

      searchIndexRequest.open('GET', '../index.map.json');
      searchIndexRequest.onload = function () {
        if (this.status != 200) {
          return;
        }
        searchIndex = JSON.parse(this.responseText);
        buildIndex(options);
      }
      searchIndexRequest.send();
    }
  }

  onmessage = function (oEvent) {
    if (oEvent.data.init) {
      init(oEvent.data.init);
      return;
    }

    var q = oEvent.data.q;
    var hits = lunrIndex.search(q);
    var results = [];
    hits.forEach(function (hit) {
      var item = searchData[hit.ref];
      results.push({ 'href': item.href, 'title': item.title, 'keywords': item.keywords });
    });
    postMessage({ e: 'query-ready', q: q, d: results });
  }

  function buildIndex(options) {
    if (stopWords !== null && (!options.prebuildIndex || prebuildIndex != null) && !isEmpty(searchData)) {
      lunrIndex = lunr(function () {
        this.pipeline.remove(lunr.stopWordFilter);
        this.ref('href');
        this.field('title', { boost: 50 });
        this.field('keywords', { boost: 20 });

        for (var prop in searchData) {
          if (searchData.hasOwnProperty(prop)) {
            this.add(searchData[prop]);
          }
        }

        var docfxStopWordFilter = lunr.generateStopWordFilter(stopWords);
        lunr.Pipeline.registerFunction(docfxStopWordFilter, 'docfxStopWordFilter');
        this.pipeline.add(docfxStopWordFilter);
        this.searchPipeline.add(docfxStopWordFilter);
      });
      postMessage({ e: 'index-ready' });
    }
  }

  function isEmpty(obj) {
    if (!obj) return true;

    for (var prop in obj) {
      if (obj.hasOwnProperty(prop))
        return false;
    }

    return true;
  }
})();
