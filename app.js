const express = require("express");

const app = express();

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const dbPath = path.join(__dirname, "moviesData.db");

app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
    directorName: dbObject.director_name,
  };
};

//API 1 GET a list of all movie names in the movie table

app.get("/movies/", async (request, response) => {
  const getMoviesQuery = `
    SELECT 
    movie_name
    FROM movie
    `;
  const playersArray = await db.all(getMoviesQuery);
  response.send(
    playersArray.map((movie) => convertDbObjectToResponseObject(movie))
  );
});

//API 2 new movie in the movie table

app.post("/movies/", async (request, response) => {
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;
  const addMovieQuery = `
    INSERT INTO movie(director_id,movie_name,lead_actor) 
    VALUES(
        ${directorId},
        '${movieName}',
        '${leadActor}'
    )
    `;
  const dbResponse = await db.run(addMovieQuery);
  const movieId = dbResponse.lastId;
  response.send("Movie Successfully Added");
});

//API 3 GET a  movie  from movie table Movies with id starting from 46 to 116 are only available in the movie table.

app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const getMovieQuery = `
    SELECT * FROM movie WHERE movie_id = ${movieId}
    
    `;

  const movie = await db.get(getMovieQuery);
  response.send(convertDbObjectToResponseObject(movie));
});

//API 4 PUT(update) the details of a movie in the movie table based on the movie ID

app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;

  const updateMovieQuery = `
    UPDATE movie 
    SET
        director_id = ${directorId},
        movie_name = '${movieName}',
        lead_actor = '${leadActor}'
    WHERE movie_id = ${movieId}
    
    `;
  const movie = await db.run(updateMovieQuery);
  response.send("Movie Details Updated");
});

// API 5 Deletes a movie from the movie table based on the movie ID

app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const deleteMovieQuery = `
    DELETE FROM movie WHERE movie_id = ${movieId}
    `;
  const deletedMovie = await db.run(deleteMovieQuery);
  response.send("Movie Removed");
});

//API 6 GET a list of all directors in the director table

app.get("/directors/", async (request, response) => {
  const getDirectorsArrayQuery = `
    SELECT 
    *
    FROM director
    `;
  const directorsArray = await db.all(getDirectorsArrayQuery);
  response.send(
    directorsArray.map((director) => convertDbObjectToResponseObject(director))
  );
});

// API 7 GET a list of all movie names directed by a specific director

app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const getMoviesByDirectorQuery = `
    SELECT 
      movie_name 
    FROM 
      movie 
    INNER JOIN 
      director 
    ON 
      movie.director_id = director.director_id
    WHERE 
      director.director_id = ${directorId};
  `;

  const moviesArray = await db.all(getMoviesByDirectorQuery);
  response.send(
    moviesArray.map((movie) => convertDbObjectToResponseObject(movie))
  );
});

module.exports = app;
