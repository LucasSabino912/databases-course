// Ejercicio 1

/* Insertar 5 nuevos usuarios a la coleccion users. 
Para cada nuevo usuario creado, insertar un comentario realizado por el usuario la coleccion comments */

db.users.insertMany([
  {
    name: "Lucas Sabino",
    email: "lucas@example.com",
    password: "1234",
  },
  {
    name: "Ana Pérez",
    email: "ana@example.com",
    password: "abcd",
  },
  {
    name: "Carlos Gómez",
    email: "carlos@example.com",
    password: "pass123",
  },
  {
    name: "María López",
    email: "maria@example.com",
    password: "maria2025",
    dateOfBirth: new Date("1992-12-05"),
    createdAt: new Date()
  },
  {
    name: "Julián Torres",
    email: "julian@example.com",
    password: "torres99",
  }
])

// Creo una variable para ver si los datos ingresados son los correctos
let newUsers = db.users.find({
  email: { $in: [
    "lucas@example.com",
    "ana@example.com",
    "carlos@example.com",
    "maria@example.com",
    "julian@example.com"
  ]}
}).toArray()

// Inserto comentarios a cada usuario
db.comments.insertMany([
  {
    name: "Lucas Sabino",
    email: "lucas@example.com",
    user_id: ObjectId("64f1a2c123456789abcdef01"), // Tiene que ser el ID exacto
    movie_id: ObjectId("573a1399f29313caabcee888"),
    text: "¡Este es mi primer comentario!",
    date: new Date()
  },
  {
    name: "Ana Pérez",
    email: "ana@example.com",
    user_id: ObjectId("64f1a2c123456789abcdef02"),
    movie_id: ObjectId("573a1399f29313caabcee889"),
    text: "¡Este es mi primer comentario!",
    date: new Date()
  },
  {
    name: "Juan Gómez",
    email: "juan@example.com",
    user_id: ObjectId("64f1a2c123456789abcdef03"),
    movie_id: ObjectId("573a1399f29313caabcee887"),
    text: "¡Este es mi primer comentario!",
    date: new Date()
  }
])


// Ejercicio 2

/* Listar el título, año, actores (cast), directores y rating de las 10 películas con mayor rating
(“imdb.rating”) de la década del 90. ¿Cuál es el valor del rating de la película que tiene mayor rating? 
(Hint: Chequear que el valor de “imdb.rating” sea de tipo “double”). */

db.movies.find(
  {
    year: { $gte: 1990, $lte: 1999 },   // películas entre 1990 y 1999 inclusive
    "imdb.rating": { $type: "double" }  
  },
  {
    title: 1,
    year: 1,
    cast: 1,
    directors: 1,
    rating: "$imdb.rating",
    _id: 0
  }
)
.sort({ "imdb.rating": -1 }) // Ordenar por imdb.rating descendente y limitar a 10
.limit(10)

// Ejercicio 3

/* Listar el nombre, email, texto y fecha de los comentarios que la película con id (movie_id) 
ObjectId("573a1399f29313caabcee886") recibió entre los años 2014 y 2016 inclusive. Listar ordenados por fecha. 
Escribir una nueva consulta (modificando la anterior) para responder ¿Cuántos comentarios recibió? */

use("mflix")
db.comments.aggregate({$match: {movie_id: ObjectId("573a1399f29313caabcee886")}}, 
{$match: {date: {$gte: ISODate("2014-01-01T00:00:00Z"), $lte: ISODate("2016-12-31T23:59:59Z")}}})

db.comments.find(
  {
    movie_id: ObjectId("573a1399f29313caabcee886"),
    date: {
      $gte: ISODate("2014-01-01T00:00:00Z"),
      $lte: ISODate("2016-12-31T23:59:59Z")
    }
  },
  {
    name: 1,
    email: 1,
    text: 1,
    date: 1,
    _id: 0
  }
).sort({ date: 1 })

// Ejercicio 4

/* Listar el nombre, id de la película, texto y fecha de los 3 comentarios más recientes realizados 
por el usuario con email patricia_good@fakegmail.com */

use("mflix")
db.comments.find(
  { email: "patricia_good@fakegmail.com" },
)
.sort({ date: -1 })
.limit(3)


// Ejercicio 5

/* Listar el título, idiomas (languages), géneros, fecha de lanzamiento (released) y número de votos (“imdb.votes”) 
de las películas de géneros Drama y Action (la película puede tener otros géneros adicionales), 
que solo están disponibles en un único idioma y por último tengan un rating (“imdb.rating”) mayor a 9 o bien tengan 
una duración (runtime) de al menos 180 minutos. Listar ordenados por fecha de lanzamiento y número de votos. */

db.movies.findOne() // Busco algun documento para saber la estructura

db.movies.find(
    // PRIMER ARGUMENTO: El criterio de búsqueda (QUERY)
    {
        // 1. CONDICIÓN PRINCIPAL (AND implícito):
        // Busca documentos (películas) donde el array 'genres' (géneros)
        // contenga *todos* los elementos especificados: "Drama" Y "Action".
        // Ambas deben estar presentes.
        genres: { $all: ["Drama", "Action"] },

        // 2. CONDICIÓN PRINCIPAL (AND implícito):
        // Busca documentos donde el array 'countries' (países de producción)
        // tenga exactamente 1 elemento (es decir, una producción de un solo país).
        countries: { $size: 1 },

        // 3. CONDICIÓN PRINCIPAL (OR explícito):
        // La película debe cumplir *al menos una* de las condiciones dentro de este array.
        $or: [
            // Opción A del OR: El campo 'imdb.rating' (calificación de IMDb)
            // debe ser Estrictamente Mayor Que 9.
            { "imdb.rating": { $gt: 9 } },

            // Opción B del OR: El campo 'runtime' (duración en minutos)
            // debe ser Mayor o Igual Que 180 (3 horas o más).
            { runtime: { $gte: 180 } }
        ]
    },

    // SEGUNDO ARGUMENTO: Proyección (FIELDS)
    {
        // 1. Incluir el campo 'title' (título). El valor '1' indica inclusión.
        title: 1,

        // 2. Incluir el campo 'country'.
        country: 1,

        // 3. Incluir el campo 'genres'.
        genres: 1,

        // 4. Incluir el campo 'imdb.votes' (votos en IMDb).
        "imdb.votes": 1,

        // Nota: El campo '_id' se incluye por defecto, a menos que se especifique '_id: 0'.
    }
)
// TERCER PASO (Método de cursor): Ordenamiento (SORT)
// Ordena los resultados primero por la fecha de estreno ('released') de forma ascendente (1).
// Para películas estrenadas el mismo día, ordena por el número de votos en IMDb ('imdb.votes')
// de forma descendente (-1, es decir, del mayor número de votos al menor).
.sort( {released: 1, "imdb.votes": -1 })

// Ejercicio 6

/* Listar el id del teatro (theaterId), estado (“location.address.state”), ciudad (“location.address.city”), 
y coordenadas (“location.geo.coordinates”) de los teatros que se encuentran 
en algunos de los estados "CA", "NY", "TX" y el nombre de la ciudades comienza con una ‘F’. 
Listar ordenados por estado y ciudad. */

db.theaters.find(
  {
    "location.address.state": { $in: ["CA", "NY", "TX"]}, // Filtra teatros que estén en alguno de estos estados
    "location.address.city": /^F/i // Filtra ciudades que empiecen con la letra F (case sensitive)
  },
  {
    theaterId: 1,
    "location.address.state": 1,
    "location.address.city": 1,
    "location.geo.coordinates": 1
  }
).sort(
  {
    "location.address.state": 1,  // Orden ascendente por estado
    "location.address.city": 1   // Orden ascendente por ciudad dentro de cada estado
  }
)


// Ejercicio 7

/* Actualizar los valores de los campos texto (text) y fecha (date) del comentario 
cuyo id es ObjectId("5b72236520a3277c015b3b73") a "mi mejor comentario" y fecha actual respectivamente. */

db.comments.updateOne(
  { _id: ObjectId("5b72236520a3277c015b3b73") }, // Filtro: comentario específico por su _id
  {
    $set: {
      text: "mi mejor comentario",  // Nuevo texto
      date: "$NOW"  // Fecha actual
    }
  }
)

// Verificacion
db.comments.find(
  { _id: ObjectId("5b72236520a3277c015b3b73") },
  { text: 1, date: 1, _id: 0 }
)

// Ejercicio 8

/* Actualizar el valor de la contraseña del usuario cuyo email es joel.macdonel@fakegmail.com a "some password". 
La misma consulta debe poder insertar un nuevo usuario en caso que el usuario no exista. 
Ejecute la consulta dos veces. ¿Qué operación se realiza en cada caso?  (Hint: usar upserts). */

db.users.updateOne(
  { email: "joel.macdonel@fakegmail.com" },{
    $set: { password: "some password" }     // Actualizamos la contraseña
  },
  { upsert: true } // Si no existe, crea un nuevo documento
)
