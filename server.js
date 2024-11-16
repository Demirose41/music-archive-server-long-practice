const http = require('http');
const fs = require('fs');

/* ============================ SERVER DATA ============================ */
let artists = JSON.parse(fs.readFileSync('./seeds/artists.json'));
let albums = JSON.parse(fs.readFileSync('./seeds/albums.json'));
let songs = JSON.parse(fs.readFileSync('./seeds/songs.json'));

let nextArtistId = 2;
let nextAlbumId = 2;
let nextSongId = 2;

// returns an artistId for a new artist
function getNewArtistId() {
  const newArtistId = nextArtistId;
  nextArtistId++;
  return newArtistId;
}

// returns an albumId for a new album
function getNewAlbumId() {
  const newAlbumId = nextAlbumId;
  nextAlbumId++;
  return newAlbumId;
}

// returns an songId for a new song
function getNewSongId() {
  const newSongId = nextSongId;
  nextSongId++;
  return newSongId;
}

/* ======================= PROCESS SERVER REQUESTS ======================= */
const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // assemble the request body
  let reqBody = "";
  req.on("data", (data) => {
    reqBody += data;
  });

  req.on("end", () => { // finished assembling the entire request body
    // Parsing the body of the request depending on the "Content-Type" header
    if (reqBody) {
      switch (req.headers['content-type']) {
        case "application/json":
          req.body = JSON.parse(reqBody);
          break;
        case "application/x-www-form-urlencoded":
          req.body = reqBody
            .split("&")
            .map((keyValuePair) => keyValuePair.split("="))
            .map(([key, value]) => [key, value.replace(/\+/g, " ")])
            .map(([key, value]) => [key, decodeURIComponent(value)])
            .reduce((acc, [key, value]) => {
              acc[key] = value;
              return acc;
            }, {});
          break;
        default:
          break;
      }
      console.log(req.body);
    }

    /* ========================== ROUTE HANDLERS ========================== */

    let urlParts = req.url.split("/")

    //"Get all articles"
    if(req.method === "GET" && req.url === "/artists"){
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json")
      res.body = JSON.stringify(artists)
      res.end(res.body);
      return;
    }

    // Get a specific artist's detatils based on artist ID
    if(req.method === "GET" && req.url.startsWith("/artists") && urlParts.length === 3){
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json")
      if(!artists[urlParts[2]]){
        res.statusCode = 400;
        res.write("artist not found")
        return res.end(); 
      }
      let artist = artists[urlParts[2]];
      let artistAlbums = []
      for ( const [id, album] of Object.entries(albums) ){
        if(album.artistId === Number(urlParts[2])) {
          artistAlbums.push(album)
        }
      }
      artist["albums"] = artistAlbums;
      res.body = JSON.stringify(artists[urlParts[2]])
      res.end(res.body)
      return;
    }

    if(req.method === "POST" && req.url === "/artists"){
      const newArtistId = getNewArtistId()
      const newArtistName = req.body.name ;
      artists[newArtistId] = 
      {
        artistId: newArtistId,
        name: newArtistName
      }

      res.statusCode = 201;
      res.setHeader("Content-Type", "application/json")
      res.body = artists[newArtistId]
      return res.end(JSON.stringify(res.body));
    }

    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.write("Endpoint not found");
    return res.end();
  });
});

const port = 5000;

server.listen(port, () => console.log('Server is listening on port', port));