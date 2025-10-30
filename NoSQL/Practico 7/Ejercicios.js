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
/*Listar el nombre, id de la película, texto y fecha de los 3 comentarios más recientes realizados 
por el usuario con email patricia_good@fakegmail.com.*/