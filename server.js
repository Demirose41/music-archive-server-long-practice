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

// returns albums of a given artistId

function getAlbumsByArtist(artistId){
  const artistAlbums = []
  for ( const [id, album] of Object.entries(albums) ){
    if(album.artistId === Number(artistId)) {
      artistAlbums.push(album)
    }
  }
  return artistAlbums
}

// returns songs with a given albumId

function getSongsByAlbum(albumId){
  const albumSongs = [];
  for( const [id, song] of Object.entries(songs) ){
    if(song.albumId === Number(albumId)){
      albumSongs.push(song)
    }
  }
  return albumSongs
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
      artist["albums"] = getAlbumsByArtist(urlParts[2]);
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
        res.end("Sucessfully deleted")
        return
      }
    }

    //6. Get all albums of a specific artist based on artist Id
    if(req.method === "GET" && req.url.startsWith("/artists")
    && urlParts.length === 4){
      const artistId = urlParts[2]
      if(artists[artistId]){
        const foundAlbums = getAlbumsByArtist(artistId)
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.body = foundAlbums;
        res.end(JSON.stringify(res.body));
        return
      }
    }

    //7. Get a specific album's details based on albumId
    if(req.method === "GET" && req.url.startsWith("/albums")
    && urlParts.length === 3){
      const albumId = urlParts[2];
      if(albums[albumId]){
        const foundSongs = getSongsByAlbum(albumId);
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        const album = albums[albumId];
        album["songs"] = foundSongs;
        res.body = album;
        res.end(JSON.stringify(res.body));
        return
      }
    }

    //8. Add an album to a specific artist based on artistId
    if(req.method === "POST" && req.url.startsWith("/artists")
    && urlParts.length === 4){
      const artistId = urlParts[2];
      if(artists[artistId]){
        const newAlbumId = getNewAlbumId();
        const newAlbumName = req.body.name;
        albums[newAlbumId] = {
          "name": newAlbumName,
          "albumId": newAlbumId,
          "artistId": Number(artistId)
        }
      res.statusCode = 201;
      res.setHeader("Content-Type", "application/json")
      res.body = albums[newAlbumId]
      return res.end(JSON.stringify(res.body));
      }else{
        res.statusCode = 400
        res.write("artist not found")
        return res.end(); 
      }
    }



    //9. Edit a specified album by albumId
    
    if ((req.method === "PUT" || req.method === "PATCH") && req.url.startsWith("/albums/") && urlParts.length === 3) {
      if(!req.body.name){ res.statusCode = 422; return res.end()}

      const currentAlbumId = urlParts[2];
      let currentAlbum = albums[currentAlbumId];
      if(currentAlbum){


        currentAlbum.name = req.body.name
        
        res.statusCode = 200
        
        res.setHeader("Content-Type", "application/json")
        
        res.body = currentAlbum;
        
        res.end(JSON.stringify(res.body))
        return;
      
      }
    }

    //10. Delete a specified album by albumId
    if (req.method === "DELETE" && req.url.startsWith("/albums/") && urlParts.length === 3){
      const albumId = urlParts[2];
      if(!albums[albumId]) { res.statusCode = 422; return res.end()}

      delete albums[albumId];
      res.statusCode = 200;
      res.setHeader("Content-Type","application/json")
      res.end("Successfully deleted")
      return
    }

    

    // Error Catch
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.write("Endpoint not found");
    return res.end();
  });
});

const port = 5000;

server.listen(port, () => console.log('Server is listening on port', port));