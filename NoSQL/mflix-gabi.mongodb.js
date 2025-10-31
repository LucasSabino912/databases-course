// 1
use("mflix");
db.users.insertMany([
  { 
    name: "sabin", 
    email: "luismi.un.sol@lucas.plata.gracias", 
    password: "TheKillerCR" 
  },  
  { 
    name: "LaMariconeta", 
    email: "uwu@Cr.com", 
    password: "wawa" 
  },   
  { 
    name: "sopa", 
    email: "so@pa.sopa", 
    password: "spa" 
  },
  { 
    name: "minipekka", 
    email: "mini@mini.mama", 
    password: "aña" 
  }, 
  { 
    name: "luismi", 
    email: "kukas@un.sol", 
    password: "sueñasueña" 
  } 
]);

db.comments.insertMany([
  {
    name: "luismi",
    email: "kukas@un.sol",
    movie_id: ObjectId('573a1390f29313caabcd4132'),
    text: "o tu o ninguna, no tengo salida"
  },
  {
    name: "sabin",
    email: "luismi.un.sol@lucas.plata.gracias",
    movie_id: ObjectId('573a1390f29313caabcd4132'),
    text: "pues detrás de tí mi amor, tan solo hay bruma"
  },
  {
    name: "La Mariconeta",
    email: "uwu@Cr.com",
    movie_id: ObjectId('573a1390f29313caabcd4135'),
    text: "hay que ganar la guerra clan"
  },
  {
    name: "minipekka", 
    email: "mini@mini.mama", 
    movie_id: ObjectId('573a1390f29313caabcd4136'),
    text: "aña"
  },
  {
    name: "sopa", 
    email: "so@pa.sopa", 
    movie_id: ObjectId('573a1390f29313caabcd4137'),
    text: "estornudo en la sopa"
  }
]);

// 1.5

/*
db.users.aggregate([
  {
   $lookup:
   {
    from: "comments",
    localField: "email",
    foreignField: "email",
    as: "comm"
   }
  },
  {$sort:{_id:-1}}, 
  {
    $project:
    {
      _id: 0,
      name: 1,
      email: 1,
      comments: "$comm.text" 
    }
  },
  {$limit: 5}
]);
*/

use("mflix");
db.users.aggregate([
  {
    $lookup: {
      from: "comments",
      let: { userEmail: "$email" },
      pipeline: [
        {
          //  junta commentarios con sus peliculas por id
          $lookup: {
            from: "movies",
            localField: "movie_id", // de comments
            foreignField: "_id",
            as: "movieInfo"
          }
        },

        //  matchea por email comments con users 
        {$match: {$expr: { $eq: ["$email", "$$userEmail"] }}},
        {
          $project: {
            _id: 0,
            text: 1,
            // title: "$movieInfo.title"
            title: { $arrayElemAt: ["$movieInfo.title", 0] }
          }
        }
      ],
      as: "comments"
    }
  },
  {$sort: {_id: -1}},
  {
    $project: {
      _id: 0,
      name: 1,
      email: 1,
      comments: 1 //  [{text, title}]
    }
  },
  {$limit: 5}
]);

// 2

/**
 * Solo necesitas $expr cuando:
 * Comparas dos campos entre sí: { $expr: { $gt: ["$budget", "$revenue"] } }
 * Usas operadores de agregación en queries normales
 */
use("mflix");
db.movies.find(
  {
    "imdb.rating": {$type: "double"},
    year: {$gte: 1990, $lte: 2000}
  },
  {
    title: 1,
    year: 1,
    cast: 1,
    directors: 1,
    rating: "$imdb.rating",
    _id: 0
  }
).sort({"imdb.rating":-1}).limit(10);

/**
 * Listar el nombre, email, texto y fecha de los comentarios que la película con id
 * (movie_id) ObjectId("573a1399f29313caabcee886") recibió entre los años 2014 y 2016
 * inclusive. Listar ordenados por fecha. 
 * Escribir una nueva consulta (modificando la anterior) para responder 
 * ¿Cuántos comentarios recibió?
 */

use("mflix")
db.comments.aggregate([
  {$match: {movie_id: ObjectId("573a1399f29313caabcee886")}},
  {$addFields: {year: { $year: "$date" }}},
  {$match: {year: { $gte: 2014, $lte: 2016 }}},
  {
    $project: {
      name: 1,
      email: 1,
      text: 1,
      date: 1
    }
  },
  {$sort: {fecha: 1}},
  {$count: "coms"}
])

use("mflix")
db.comments.aggregate([
  { 
    $match: { 
      movie_id: ObjectId("573a1399f29313caabcee886"),
      date: {
        $gte: ISODate("2014-01-01T00:00:00Z"),
        $lte: ISODate("2016-12-31T23:59:59Z")
      }
    }
  },
  {
    $project: {
      _id: 0,
      name:1,
      email: 1,
      text: 1,
      date: 1
    }
  },
  { $sort: { fecha: 1 } }     // Sort by date ascending
])

/**
 * Listar el nombre, id de la película, texto y fecha de los 3 comentarios más recientes
 * realizados por el usuario con email patricia_good@fakegmail.com. 
 */
use("mflix")
db.comments.find({email: "patricia_good@fakegmail.com"},
  {
    _id:0, 
    name:1,
    movie_id: 1,
    text: 1,
    date: 1
  },
  {sort: {date: -1}}
).limit(3);

/**
 * Listar el título, idiomas (languages), géneros, fecha de lanzamiento (released) y número
 * de votos (“imdb.votes”) de las películas de géneros Drama y Action (la película puede
 * tener otros géneros adicionales), que solo están disponibles en un único idioma y por
 * último tengan un rating (“imdb.rating”) mayor a 9 o bien tengan una duración (runtime)
 * de al menos 180 minutos. Listar ordenados por fecha de lanzamiento y número de
 * votos. 
 **/

use("mflix");
db.movies.find(
  {
    genres: {$all: ["Drama", "Action"]},
    languages: { $size: 1 },
    $or:[
      {"imdb.rating": {$gt: 9}}, 
      {"runtime": {$gt: 180}}
    ],
    released: {$ne: null, $exists: true }
  },
  {
    _id:0,
    title: 1,
    languages: 1,
    genres: 1,
    released: { $toString: "$released" },
    votes: "$imdb.votes"
  },
  {sort: {released: 1, "imdb.votes":1}}
);

/**
 * Listar el id del teatro (theaterId), estado (“location.address.state”), ciudad
 * (“location.address.city”), y coordenadas (“location.geo.coordinates”) de los teatros que
 * se encuentran en algunos de los estados "CA", "NY", "TX" y el nombre de la ciudades
 * comienza con una ‘F’. Listar ordenados por estado y ciudad.
 */

use("mflix")
db.theaters.find(
  {
    "location.address.state": {$in: ["CA", "NY", "TX"]},
    $expr: {$eq: [{ $substr: ["$location.address.city", 0, 1] }, "F"]}
  }
).sort({"location.adress.state": 1, "location.address.city": 1})