var http = require('http')
  , url  = require('url')
  , fs   = require('fs')
  , elasticsearch = require('elasticsearch')
  , port = 8080

var client = new elasticsearch.Client({
  host: 'localhost:9200',
  log: 'trace' // CHANGE THIS TO trace WHEN TESTING/DEBUGGING, info OTHERWISE
});

// this is how you would ping the client
function clientPing(){
  client.ping({
    requestTimeout: 30000,
  }, function (error){
    if (error) {
      console.error('elasticsearch cluset is down!');
    } else {
      console.log('All is well');
    }
  });
}

// THIS IS HOW YOU SEARCH WITH THE QUERY 'PANTS' (RETURNS EVERYTHING THAT HAS PANTS IN IT)
function clientSuperSimpleSearch(){
  client.search({
    q: 'pants'
  }).then(function (body){
    var hits = body.hits.hits;
  }, function (error){
    console.trace(error.message);
  });
}

// find songs that have "blues in their title field"
function clientSearch(){
  client.search({
    index: 'million_songs',
    type: 'song',
    body: {
      query: {
        match: {
          title: 'blues'
        }
      }
    }
  }).then(function (resp){
    var hits = resp.hits.hits;
    // console.log(resp)
    console.log(resp.hits.total)  // this is the number of results
  }, function (err){
    console.trace(err.message);
  }); 
}






// SAMPLE FUNCTIONS START HERE:

// NOTE: all min/max years are inclusive (for exclusive do gte-->gt and lte-->lt)
// for most of these, also consider doing when the year is 0 (that's default/no year)
function sampleScatterPlotByYears(min_year, max_year){
  client.search({
    index: 'million_songs',
    type: 'song',
    body: {
      _source: [
        "song_hotttnesss",   // categories here
        "artist_familiarity"    
        // consider including artist name + song name so we can mouse over things maybe
      ],
      size: 10000, 
      query: {
        range: {
          year: {
            gte: min_year,
            lte: max_year
          }
        }
      }
    }
  }).then(function (resp){
    console.log(resp.hits.hits) // and then get whatever fields are relevant
  }, function(err){
    console.trace(err.message)
  })
}

function barGraphByDecades(){
  client.search({
    index: 'million_songs',
    type: 'song',
    body: {
      query: {
        range: {
          year: {
            gte: 1920
          }
        }
      },
      size: 0,
      aggs: {
        by_year: {
          histogram: {
            field: "year",
            interval: 10    // 10 years
          }, 
          aggs: {
            avg_hotttnesss: {
              avg: {
                field: "song_hotttnesss"
              }
            }
          }
        }
      }
    }
  }).then(function (resp){
    console.log(resp)
  }, function (err){
    console.trace(err.message);
  }); 
}

function topTitleWords(min_year, max_year){
  client.search({
    index: 'million_songs', 
    type: 'song',
    body: {
      query: {
        range: {
          year: {
            gte: min_year,
            lte: max_year
          }
        }
      },
      size: 0,
      aggs: {
        top_title_words: {
          terms: {
            field: "title",   // change this to whatever field
            size: 10          // top 10 most common
          }
        }
      }
    }
  }).then(function (resp){
    console.log(resp.aggregations.top_title_words.buckets)
    // top words are in key, doc_count == number of times they show up
  }, function (err){
    console.trace(err.message);
  }); 
}



// var server = http.createServer(function (req, res){
//   var uri = url.parse(req.url)
//
//   switch(uri.pathname){
//   case '/':
//     sendFile(res, 'index.html')
//     break
//   case '/index.html':
//     sendFile(res, 'index.html')
//     break
//   case '/README.md':
//     sendFile(res, 'README.md', 'text/md')
//     break
//   case '/Readme.md':
//     sendFile(res, 'README.md', 'text/md')
//     break
//   case '/readme.md':
//     sendFile(res, 'README.md', 'text/md')
//     break
//   }
//
// })
//
// server.listen(process.env.PORT || port)
//
// function sendFile(res, filename, contentType){
//   contentType = contentType || 'text/html'
//
//   fs.readFile(filename, function(error, content){
//     res.writeHead(200, {'Content-type': contentType})
//     res.end(content, 'utf-8')
//   })
// }
