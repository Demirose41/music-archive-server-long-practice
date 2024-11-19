const http = require('http');
const fs = require('fs');
const { url } = require('inspector');

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

    // 1. Get all articles
    if(req.method === "GET" && req.url === "/artists"){
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json")
      res.body = JSON.stringify(artists)
      res.end(res.body);
      return;
    }

    // 2. Get a specific artist's detatils based on artist ID
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
    // 3. Add an Artist
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
    // 4. Edit a specified artist by artistId
    if((req.method === "PATCH" || req.method === "PUT") && req.url.startsWith("/artists")
      && urlParts.length === 3){
      if(req.body.name){
        const currentArtistId = urlParts[2];
        let currentArtist = artists[currentArtistId];

        if(currentArtist){
          currentArtist.name = req.body.name;
          res.statusCode = 200;
          res.setHeader("Content-Type","application/json")
          res.body = currentArtist
          res.end(JSON.stringify(res.body));
          return
        }
      }
    }
    //5. Delete a specified artist by artistId
    if(req.method === "DELETE" && req.url.startsWith("/artists")
    && urlParts.length === 3){
      const artistId = urlParts[2];
      if(artists[artistId]){
        delete artists[artistId];
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        console.log(artists)
        res.end("Sucessfully deleted")
        return
      }
    }
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.write("Endpoint not found");
    return res.end();
  });
});

const port = 5000;

server.listen(port, () => console.log('Server is listening on port', port));