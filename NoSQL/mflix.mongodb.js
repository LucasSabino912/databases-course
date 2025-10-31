// Ejercicio 1

/* Insertar 5 nuevos usuarios a la coleccion users. 
Para cada nuevo usuario creado, insertar un comentario realizado por el usuario la coleccion comments */

db.users.insertMany([
  {
    name: "Lucas Sabino",
    email: "lucas@example.com",
    password: "1234",
    dateOfBirth: new Date("1990-05-15"),
    createdAt: new Date()
  },
  {
    name: "Ana Pérez",
    email: "ana@example.com",
    password: "abcd",
    dateOfBirth: new Date("1995-09-20"),
    createdAt: new Date()
  },
  {
    name: "Carlos Gómez",
    email: "carlos@example.com",
    password: "pass123",
    dateOfBirth: new Date("1988-01-30"),
    createdAt: new Date()
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
    dateOfBirth: new Date("1998-07-11"),
    createdAt: new Date()
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
newUsers.forEach(user => {
  db.comments.insertOne({
    name: user.name,
    email: user.email,
    user_id: user._id,
    movie_id: ObjectId(),
    text: "¡Este es mi primer comentario!",
    date: new Date()
  })
})


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
    "imdb.rating": 1,
    _id: 0
  }
)
.sort({ "imdb.rating": -1 }) // Ordenar por imdb.rating descendente y limitar a 10
.limit(10)

// Ejercicio 3

/* Listar el nombre, email, texto y fecha de los comentarios que la película con id (movie_id) 
ObjectId("573a1399f29313caabcee886") recibió entre los años 2014 y 2016 inclusive. Listar ordenados por fecha. 
Escribir una nueva consulta (modificando la anterior) para responder ¿Cuántos comentarios recibió? */

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

db.comments.find(
  { email: "patricia_good@fakegmail.com" },
  { name: 1, movie_id: 1, text: 1, date: 1, _id: 0 }
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
  {
    genres: { $all: ["Drama", "Action"] },
    languages: { $size: 1 },
    $or: [
      { "imdb.rating": { $gt: 9 } },
      { runtime: { $gte: 180 } }
    ]
  },
  {
    title: 1,
    languages: 1,
    genres: 1,
    released: 1,
    "imdb.votes": 1,
    _id: 0
  }
).sort({ released: 1, "imdb.votes": -1 })

// Ejercicio 6

/* Listar el id del teatro (theaterId), estado (“location.address.state”), ciudad (“location.address.city”), 
y coordenadas (“location.geo.coordinates”) de los teatros que se encuentran 
en algunos de los estados "CA", "NY", "TX" y el nombre de la ciudades comienza con una ‘F’. 
Listar ordenados por estado y ciudad. */

db.theaters.find(
  {
    // Filtra teatros que estén en alguno de estos estados
    "location.address.state": { $in: ["CA", "NY", "TX"] },

    // Filtra ciudades cuyo nombre empieza con 'F' (case-insensitive)
    "location.address.city": { $regex: /^F/, $options: "i" }
  },
  {
    // Campos que queremos mostrar en el resultado
    theaterId: 1,                    // ID del teatro
    "location.address.state": 1,     // Estado
    "location.address.city": 1,      // Ciudad
    "location.geo.coordinates": 1,   // Coordenadas geográficas [longitud, latitud]
    _id: 0                           // Oculta el _id que Mongo agrega por defecto
  }
)
.sort(
  {
    "location.address.state": 1, // Orden ascendente por estado
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
      date: new Date()              // Fecha actual
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
  { email: "joel.macdonel@fakegmail.com" }, // Filtro por email
  {
    $set: { password: "some password" }     // Actualizamos la contraseña
  },
  { upsert: true }                          // Si no existe, crea un nuevo documento
)
