var http = require('http')
  , url  = require('url')
  , fs   = require('fs')
  , elasticsearch = require('elasticsearch')
  , port = 8080

var client = new elasticsearch.Client({
  host: 'localhost:9200',
  log: 'trace' // CHANGE THIS TO trace WHEN TESTING/DEBUGGING, info OTHERWISE
});


// THIS IS HOW YOU WOULD PING THE CLIENT
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

// IGNORE 404 RESPONSES BY DOING THIS
function clientDelete(){
  client.indices.delete({
    index: 'test_index',
    ignore: [404]
  }).then(function (body){
    // since we told the client to ignore 404 errors, the
    // promise is resolved even if the index does not exist
    console.log('index was deleted or never existed');
  }, function(error){
    // oh no!
    console.trace(error.message);
  });
}

// THIS IS HOW YOU DO A SLIGHTLY MORE COMPLICATED SEARCH QUERY
// find songs that have "blues in their title field"
// function clientSearch(){
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
  }, function (err){
    console.trace(err.message);
  }); 
// }



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
