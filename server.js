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



var server = http.createServer(function (req, res){
  var uri = url.parse(req.url)

  switch(uri.pathname){
  case '/':
    sendFile(res, 'index.html')
    break
  case 'readme.json':
    sendFile(res, 'readme.json', 'application/json')
    break
  case '/index.html':
    sendFile(res, 'index.html')
    break
  case '/README.md':
    sendFile(res, 'README.md', 'text/md')
    break
  case '/Readme.md':
    sendFile(res, 'README.md', 'text/md')
    break
  case '/readme.md':
    sendFile(res, 'README.md', 'text/md')
    break
  }

})

server.listen(process.env.PORT || port);
console.log('listening at port: ' + port);

function sendFile(res, filename, contentType){
  contentType = contentType || 'text/html'

  fs.readFile(filename, function(error, content) {
    res.writeHead(200, {'Content-type': contentType})
    res.end(content, 'utf-8')
  });
}



// SAMPLE FUNCTIONS START HERE:
// NOTE: all min/max years are inclusive (for exclusive do gte-->gt and lte-->lt)
// for most of these, also consider doing when the year is 0 (that's default/no year)
function sampleScatterPlotByYears(min_year, max_year){
  console.log('init search')
  console.log(min_year + " " + max_year)
  client.search({
    index: 'million_songs',
    type: 'song',
    body: {
      _source: [
        "artist_hottnesss",   // !!!!hottnesss has two Ts and three Ss
        "artist_familiarity",
        "artist_name",
        "title"
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
    //console.log(resp.hits.hits) // and then get whatever fields are relevant
    scatterYearQueryEmitter(resp.hits.hits);
  }, function(err){
    console.trace(err.message)
  })
}

function barGraphByYears(){
  client.search({
    index: 'million_songs',
    type: 'song',
    body: {
      query: {
        range: {
          year: {
            gte: 0
          }
        }
      },
      size: 0,
      aggs: {
        by_year: {
          histogram: {
            field: "year",
            interval: 1,     // 10 years
            min_doc_count: 1  // don't return results unless there's at least 1 thing there
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
    barYearQueryEmitter(resp.aggregations.by_year.buckets);
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
          terms: {    // FIX THIS MAYBE
            field: "title",   // change this to whatever field
            size: 10          // top 10 most common
          }
        }
      }
    }
  }).then(function (resp){
    //console.log(resp.aggregations.top_title_words.buckets)
    pieYearQueryEmitter( resp.aggregations.top_title_words.buckets);
    // top words are in key, doc_count == number of times they show up
  }, function (err){
    console.trace(err.message);
  }); 
}




  //socket.io things follow
  var io = require('socket.io')(server)//init socket.io on server

  io.on('connection', function (socket) {//what to do on starting the connection
    console.log('connected!!');
    socket.emit('I am born', { hello: 'world' });//send a message to the client with the event 'I am born'
    socket.on('pie year query request',pieYearQuery );//listen for the event 'pie year query' for messages, then run pieYearQuery
    socket.on('bar year query request',barYearQuery );//listen for the event 'pie year query' for messages, then run pieYearQuery
    socket.on('scatter year query request',scatterYearQuery );//listen for the event 'pie year query' for messages, then run pieYearQuery
  });



function scatterYearQuery(data) {
  console.log('recieved a scatter year query');
  console.log(data);
  var num1 = parseInt(data)
  var num2 = num1 +10;
  sampleScatterPlotByYears(num1, num2);
}
function scatterYearQueryEmitter(result) {
  console.log('I got a scatter result')
  var resultList = []
  result.forEach(function(d){
    if(d._source.artist_hottnesss){
      resultList.push(d._source);
    }
  });

  console.log(resultList);
  // var queryResult = {'result': data};
  io.emit('scatter year query response', resultList);//send a message from within a function
}

function barYearQuery() {
  console.log('recieved a bar year request');
  barGraphByYears();
}

function barYearQueryEmitter(result) {
  console.log('I got a bar result')
  console.log(result);
  // var queryResult = {'result': data};
  io.emit('bar year query response', result);//send a message from within a function
}

  //a sample function to show that data can be received from the client and processed,
  //and then results are sent back to the client
  function pieYearQuery(data) {
    console.log('recieved a pie year query');
    console.log(data);
    var num1 = parseInt(data)
    var num2 = num1 +10;
    topTitleWords(num1, num2);
  }
  function pieYearQueryEmitter(result) {
    console.log('I got a pie result')
    console.log(result);
    // var queryResult = {'result': data};
    io.emit('pie year query response', result);//send a message from within a function
  }