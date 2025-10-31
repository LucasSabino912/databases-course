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

/* PRACTICO 8: PIPELINE DE AGREGACIÓN */

// Ejercicio 1: Cantidad de cines (theaters) por estado

db.theaters.aggregate([
  {
    $group: {
      _id: "location.address.state", // Agrupo por estado
      total_theaters: { $sum: 1 }    // Cantidad de teatros por estado
    }
  },
  {
    $sort: { total_theaters: -1 } 
  }
])

// Ejercicio 2: Cantidad de estados con al menos dos cines (theaters) registrados.

db.theaters.aggregate([
  {
    $group: {
      _id: "location.address.state",
      total_theaters: { $sum: 1 }
    }
  },
  {
    $match: {
      total_theaters: { $lte: 2}
    }
  },
  {
    $count: "estados_con_menos_de_dos_cines"
  }
])

// Ejercicio 3: Cantidad de películas estrenadas en los años 50 (desde 1950 hasta 1959). 
// Se puede responder sin pipeline de agregación, realizar ambas queries.

db.movies.find(
  { year: { $gte: 1950, $lte: 1959 } }  // Filtra películas entre 1950 y 1959
).count()


db.movies.aggregate([
  { 
    $match: { year: { $gte: 1950, $lte: 1959 } }  // Filtra los años 50
  },
  { 
    $count: "peliculas_anos_50"                    // Cuenta cuántos documentos cumplen la condición
  }
])

// Ejercicio 4: Cantidad de películas dirigidas por "Louis Lumière". 
// Se puede responder sin pipeline de agregación, realizar ambas queries.

db.movies.find(
  { directors: "Louis Lumiere" }
).count()

db.movies.aggregate([
  { 
    $match: { directors: "Louis Lumière" }  // Filtra películas del director
  },
  { 
    $count: "peliculas_louis_lumiere"       // Cuenta cuántos documentos cumplen
  }
])

// Ejercicio 5: Listar los 10 géneros con mayor cantidad de películas 
// (tener en cuenta que las películas pueden tener más de un género). 
// Devolver el género y la cantidad de películas. Hint: unwind puede ser de utilidad

db.movies.aggregate([
  // Separar cada elemento del array genres en un documento distinto
  { $unwind: "$genres" }, // Crea un documento por elemento del array

  // Agrupar por género y contar cuántas películas hay
  { 
    $group: { 
      _id: "$genres",           // el género
      cantidad: { $sum: 1 }     // suma 1 por cada película que tenga este género
    }
  },

  // Ordenar de mayor a menor cantidad
  { $sort: { cantidad: -1 } },

  // Limitar a los 10 géneros con más películas
  { $limit: 10 },

  // Renombrar campos para que el resultado sea más legible
  { 
    $project: { 
      _id: 0,
      genero: "$_id",
      cantidad: 1
    }
  }
])


// Ejercicio 6: Top 10 de usuarios con mayor cantidad de comentarios, 
// mostrando Nombre, Email y Cantidad de Comentarios.

db.comments.aggregate([
  {
    $group: {
      _id: { name: "$name", email: "$email" },
      cantidadComentarios: { $sum: 1 }
    }
  },
  { $sort: { cantidadComentarios: -1 } },
  { $limit: 10 },
  {
    $project: {
      _id: 0,
      Nombre: "$_id.name",
      Email: "$_id.email",
      CantidadComentarios: 1
    }
  }
]);


// Ejercicio 7 :Ratings de IMDB promedio, mínimo y máximo por año de las películas 
// estrenadas en los años 80 (desde 1980 hasta 1989), ordenados de mayor a menor por promedio del año.

db.movies.aggregate([
  { $match: { year: { $gte: 1980, $lte: 1989 }, "imdb.rating": { $ne: null } } },
  {
    $group: {
      _id: "$year",
      promedio: { $avg: "$imdb.rating" },
      minimo: { $min: "$imdb.rating" },
      maximo: { $max: "$imdb.rating" }
    }
  },
  { $sort: { promedio: -1 } }
]);

// Ejercicio 8: Título, año y cantidad de comentarios de las 10 películas con más comentarios.

db.comments.aggregate([
  {
    $group: {
      _id: "$movie_id",
      cantidadComentarios: { $sum: 1 }
    }
  },
  {
    $lookup: {
      from: "movies",
      localField: "_id",
      foreignField: "_id",
      as: "pelicula"
    }
  },
  { $unwind: "$pelicula" },
  {
    $project: {
      _id: 0,
      Titulo: "$pelicula.title",
      Año: "$pelicula.year",
      cantidadComentarios: 1
    }
  },
  { $sort: { cantidadComentarios: -1 } },
  { $limit: 10 }
]);


// Ejercicio 9: Crear una vista con los 5 géneros con mayor cantidad de comentarios, 
// junto con la cantidad de comentarios.

db.comments.aggregate([
  {
    $lookup: {
      from: "movies",
      localField: "movie_id",
      foreignField: "_id",
      as: "pelicula"
    }
  },
  { $unwind: "$pelicula" },
  { $unwind: "$pelicula.genres" },
  {
    $group: {
      _id: "$pelicula.genres",
      cantidadComentarios: { $sum: 1 }
    }
  },
  { $sort: { cantidadComentarios: -1 } },
  { $limit: 5 },
  {
    $project: {
      _id: 0,
      genero: "$_id",
      cantidadComentarios: 1
    }
  },
  { $out: "vista_top5_generos" } // crea una vista persistente
]);


// Ejercicio 10:Listar los actores (cast) que trabajaron en 2 o más películas dirigidas por "Jules Bass". 
// Devolver el nombre de estos actores junto con la lista de películas (solo título y año) 
// dirigidas por “Jules Bass” en las que trabajaron. 
// a) Hint1: addToSet
// b) Hint2: {'name.2': {$exists: true}} permite filtrar arrays con al menos 2 elementos, entender por qué.
// c) Hint3: Puede que tu solución no use Hint1 ni Hint2 e igualmente sea correcta

db.movies.aggregate([
  { $match: { directors: "Jules Bass" } },
  { $unwind: "$cast" },
  {
    $group: {
      _id: "$cast",
      peliculas: { $addToSet: { titulo: "$title", año: "$year" } }
    }
  },
  // Filtra solo actores que tienen 2 o más películas
  { $match: { "peliculas.1": { $exists: true } } },
  {
    $project: {
      _id: 0,
      actor: "$_id",
      peliculas: 1
    }
  }
]);



// Ejercicio 11: Listar los usuarios que realizaron comentarios durante el mismo mes de 
// lanzamiento de la película comentada, mostrando Nombre, Email, fecha del comentario, 
// título de la película, fecha de lanzamiento. HINT: usar $lookup con multiple condiciones 

db.comments.aggregate([
  {
    // 1️⃣ Hacemos el join entre comments y movies
    $lookup: {
      from: "movies",
      let: { movieId: "$movie_id", commentDate: "$date" },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                // Relación entre colecciones
                { $eq: ["$_id", "$$movieId"] },
                // Coinciden año y mes
                { $eq: [{ $year: "$released" }, { $year: "$$commentDate" }] },
                { $eq: [{ $month: "$released" }, { $month: "$$commentDate" }] }
              ]
            }
          }
        },
        {
          $project: { title: 1, released: 1, _id: 0 }
        }
      ],
      as: "pelicula"
    }
  },
  // 2️⃣ Filtramos solo los comentarios donde hubo coincidencia
  { $match: { pelicula: { $ne: [] } } },

  // 3️⃣ Formateamos salida
  {
    $project: {
      _id: 0,
      nombre: "$name",
      email: "$email",
      fecha_comentario: "$date",
      titulo_pelicula: { $arrayElemAt: ["$pelicula.title", 0] },
      fecha_lanzamiento: { $arrayElemAt: ["$pelicula.released", 0] }
    }
  }
]);


// Ejercicio 12: Listar el id y nombre de los restaurantes junto con su puntuación máxima, mínima y la suma total. Se puede asumir que el restaurant_id es único.
// a- Resolver con $group y accumulators.
// b- Resolver con expresiones sobre arreglos (por ejemplo, $sum) pero sin $group.
// c- Resolver como en el punto b) pero usar $reduce para calcular la puntuación total.
// d- Resolver con find.

db.restaurants.aggregate([
  // 1️⃣ $unwind descompone el array "grades" en varios documentos.
  // Cada documento del restaurante se repite una vez por cada elemento del array.
  { $unwind: "$grades" },

  // 2️⃣ $group agrupa los documentos por restaurante_id.
  // En cada grupo, aplicamos funciones acumuladoras.
  {
    $group: {
      _id: "$restaurant_id",        // agrupamos por ID de restaurante
      nombre: { $first: "$name" },  // tomamos el primer nombre del grupo (todos son iguales)
      max_score: { $max: "$grades.score" },   // puntuación máxima
      min_score: { $min: "$grades.score" },   // puntuación mínima
      total_score: { $sum: "$grades.score" }  // suma total de todas las puntuaciones
    }
  }
]);



// Ejercicio 13: Actualizar los datos de los restaurantes añadiendo dos campos nuevos. 
// a- "average_score": con la puntuación promedio
// b- "grade": con "A" si "average_score" está entre 0 y 13, con "B" si "average_score" está entre 14 y 27 con "C" si "average_score" es mayor o igual a 28    
// Se debe actualizar con una sola query.
// HINT1. Se puede usar pipeline de agregación con la operación update
// HINT2. El operador $switch o $cond pueden ser de ayuda.

db.restaurants.updateMany(
  {},
  [
    {
      $set: {
        average_score: { $avg: "$grades.score" },
        grade: {
          $switch: {
            branches: [
              { case: { $lte: ["$average_score", 13] }, then: "A" },
              { case: { $lte: ["$average_score", 27] }, then: "B" }
            ],
            default: "C"
          }
        }
      }
    }
  ]
);


/*Agregar las siguientes reglas de validación usando JSON Schema. Luego de cada
especificación testear que efectivamente las reglas de validación funcionen, intentando insertar
5 documentos válidos y 5 inválidos (por distintos motivos).*/



/* 1. Especificar en la colección users las siguientes reglas de validación: El campo name
(requerido) debe ser un string con un máximo de 30 caracteres, email (requerido) debe
ser un string que matchee con la expresión regular: &quot;^(.*)@(.*)\\.(.{2,4})$&quot; ,
password (requerido) debe ser un string con al menos 50 caracteres.*/

db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "email", "password"],
      properties: {
        name: {
          bsonType: "string",
          description: "Debe ser string",
          maxLength: 30
        },
        email: {
          bsonType: "string",
          pattern: "^(.*)@(.*)\\.(.{2,4})$",
          description: "Debe ser email válido"
        },
        password: {
          bsonType: "string",
          minLength: 50,
          description: "Debe tener al menos 50 caracteres"
        }
      }
    }
  }
});

// Insertar datos correctos
db.users.insertMany([
  { name: "Juan Perez", email: "juan@gmail.com", password: "x".repeat(50) },
  { name: "Maria Lopez", email: "maria@outlook.com", password: "A".repeat(70) },
  { name: "Carlos", email: "carlos@domain.org", password: "P".repeat(60) },
  { name: "Ana", email: "ana@yahoo.com", password: "1".repeat(90) },
  { name: "Lucho", email: "lucho@uni.edu", password: "abc".repeat(20) }
]);

// Insertar datos incorrectos
db.users.insertMany([
  { email: "juan@gmail.com", password: "x".repeat(60) }, // falta name
  { name: "A".repeat(40), email: "bad@correo.com", password: "x".repeat(60) }, // name > 30
  { name: "Juan", email: "correoInvalido", password: "x".repeat(60) }, // email no matchea regex
  { name: "Pedro", email: "pedro@gmail.com", password: "x".repeat(10) }, // password corto
  { name: 1234, email: "num@num.com", password: "x".repeat(60) } // name no string
]);

// Ver metadata
db.runCommand({ collMod: "users", validator: {} });
db.getCollectionInfos({ name: "users" })[0].options.validator;

/* 2. Obtener metadata de la colección users que garantice que las reglas de validación
fueron correctamente aplicadas.*/

db.createCollection("theaters", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["theaterId", "location"],
      properties: {
        theaterId: { bsonType: "int" },
        location: {
          bsonType: "object",
          required: ["address"],
          properties: {
            address: {
              bsonType: "object",
              required: ["street1", "city", "state", "zipcode"],
              properties: {
                street1: { bsonType: "string" },
                city: { bsonType: "string" },
                state: { bsonType: "string" },
                zipcode: { bsonType: "string" }
              }
            },
            geo: {
              bsonType: ["object", "null"],
              properties: {
                type: { enum: ["Point", null] },
                coordinates: {
                  bsonType: "array",
                  items: { bsonType: "double" },
                  minItems: 2,
                  maxItems: 2
                }
              }
            }
          }
        }
      }
    }
  },
  validationAction: "warn" // 👈 no bloquea inserciones
});

db.theaters.insertMany([
  {
    theaterId: NumberInt(1),
    location: {
      address: { street1: "Av. Siempreviva", city: "Springfield", state: "IL", zipcode: "12345" },
      geo: { type: "Point", coordinates: [40.1, -75.2] }
    }
  },
  {
    theaterId: NumberInt(2),
    location: {
      address: { street1: "Main St", city: "New York", state: "NY", zipcode: "10001" }
    }
  }
]);

db.theaters.insertMany([
  { theaterId: "cinema1", location: { address: { street1: "Fake", city: "Nowhere", state: "ZZ", zipcode: "000" } } }, // theaterId no int
  { theaterId: NumberInt(3) }, // falta address
  { theaterId: NumberInt(4), location: { address: { city: "LA", state: "CA", zipcode: "90001" } } }, // falta street1
  { theaterId: NumberInt(5), location: { address: { street1: "Calle Falsa", city: "Bogotá", state: "DC", zipcode: "11001" }, geo: { type: "Circle", coordinates: [1, 2] } } }, // type inválido
  { location: { address: { street1: "Test", city: "Test", state: "TE", zipcode: "12345" } } } // falta theaterId
]);


/* 3. Especificar en la colección theaters las siguientes reglas de validación: El campo
theaterId (requerido) debe ser un int y location (requerido) debe ser un object con:
a. un campo address (requerido) que sea un object con campos street1, city, state
y zipcode todos de tipo string y requeridos
b. un campo geo (no requerido) que sea un object con un campo type, con valores
posibles “Point” o null y coordinates que debe ser una lista de 2 doubles
Por último, estas reglas de validación no deben prohibir la inserción o actualización de
documentos que no las cumplan sino que solamente deben advertir.*/

db.createCollection("movies", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["title", "year"],
      properties: {
        title: { bsonType: "string" },
        year: { bsonType: "int", minimum: 1900, maximum: 3000 },
        cast: {
          bsonType: "array",
          uniqueItems: true,
          items: { bsonType: "string" }
        },
        directors: {
          bsonType: "array",
          uniqueItems: true,
          items: { bsonType: "string" }
        },
        countries: {
          bsonType: "array",
          uniqueItems: true,
          items: { bsonType: "string" }
        },
        genres: {
          bsonType: "array",
          uniqueItems: true,
          items: { bsonType: "string" }
        }
      }
    }
  }
});

db.movies.insertMany([
  { title: "Inception", year: NumberInt(2010), cast: ["Leonardo DiCaprio"], directors: ["Christopher Nolan"], countries: ["USA"], genres: ["Sci-Fi"] },
  { title: "Matrix", year: NumberInt(1999), cast: ["Keanu Reeves"], directors: ["Wachowski"], countries: ["USA"], genres: ["Action", "Sci-Fi"] },
  { title: "Parasite", year: NumberInt(2019), cast: ["Song Kang-ho"], directors: ["Bong Joon-ho"], countries: ["Korea"], genres: ["Drama"] },
  { title: "Toy Story", year: NumberInt(1995), cast: ["Tom Hanks"], directors: ["John Lasseter"], countries: ["USA"], genres: ["Animation"] },
  { title: "Avatar", year: NumberInt(2009), cast: ["Sam Worthington"], directors: ["James Cameron"], countries: ["USA"], genres: ["Adventure"] }
]);

db.movies.insertMany([
  { title: "Inception", year: NumberInt(2010), cast: ["Leonardo DiCaprio"], directors: ["Christopher Nolan"], countries: ["USA"], genres: ["Sci-Fi"] },
  { title: "Matrix", year: NumberInt(1999), cast: ["Keanu Reeves"], directors: ["Wachowski"], countries: ["USA"], genres: ["Action", "Sci-Fi"] },
  { title: "Parasite", year: NumberInt(2019), cast: ["Song Kang-ho"], directors: ["Bong Joon-ho"], countries: ["Korea"], genres: ["Drama"] },
  { title: "Toy Story", year: NumberInt(1995), cast: ["Tom Hanks"], directors: ["John Lasseter"], countries: ["USA"], genres: ["Animation"] },
  { title: "Avatar", year: NumberInt(2009), cast: ["Sam Worthington"], directors: ["James Cameron"], countries: ["USA"], genres: ["Adventure"] }
]);


/* 4. Especificar en la colección movies las siguientes reglas de validación: El campo title
(requerido) es de tipo string, year (requerido) int con mínimo en 1900 y máximo en
3000, y que tanto cast, directors, countries, como genres sean arrays de strings sin
duplicados.
a. Hint: Usar el constructor NumberInt() para especificar valores enteros a la hora
de insertar documentos. Recordar que mongo shell es un intérprete javascript y
en javascript los literales numéricos son de tipo Number (double). */

db.createCollection("userProfiles", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["user_id", "language"],
      properties: {
        user_id: { bsonType: "objectId" },
        language: { enum: ["English", "Spanish", "Portuguese"] },
        favorite_genres: {
          bsonType: "array",
          uniqueItems: true,
          items: { bsonType: "string" }
        }
      }
    }
  }
});

db.userProfiles.insertMany([
  { user_id: ObjectId(), language: "English", favorite_genres: ["Drama", "Comedy"] },
  { user_id: ObjectId(), language: "Spanish" },
  { user_id: ObjectId(), language: "Portuguese", favorite_genres: ["Action"] },
  { user_id: ObjectId(), language: "English", favorite_genres: ["Romance", "Horror"] },
  { user_id: ObjectId(), language: "Spanish", favorite_genres: [] }
]);

db.userProfiles.insertMany([
  { language: "English" }, // falta user_id
  { user_id: ObjectId(), language: "German" }, // idioma no permitido
  { user_id: "1234", language: "Spanish" }, // user_id no ObjectId
  { user_id: ObjectId(), language: "English", favorite_genres: ["A", "A"] }, // duplicados
  { user_id: ObjectId(), language: 123 } // language no string
]);


/* 5. Crear una colección userProfiles con las siguientes reglas de validación: Tenga un
campo user_id (requerido) de tipo “objectId”, un campo language (requerido) con alguno
de los siguientes valores [ “English”, “Spanish”, “Portuguese” ] y un campo
favorite_genres (no requerido) que sea un array de strings sin duplicados.*/

db.createCollection("userProfiles", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["user_id", "language"],
      properties: {
        user_id: {
          bsonType: "objectId",
          description: "Debe ser un ObjectId válido"
        },
        language: {
          enum: ["English", "Spanish", "Portuguese"],
          description: "Debe ser uno de los idiomas permitidos"
        },
        favorite_genres: {
          bsonType: "array",
          uniqueItems: true,
          items: {
            bsonType: "string"
          },
          description: "Array opcional de strings sin duplicados"
        }
      }
    }
  }
});

db.userProfiles.insertMany([
  { user_id: ObjectId(), language: "English", favorite_genres: ["Drama", "Comedy"] },
  { user_id: ObjectId(), language: "Spanish" },
  { user_id: ObjectId(), language: "Portuguese", favorite_genres: ["Action"] },
  { user_id: ObjectId(), language: "English", favorite_genres: ["Horror", "Romance"] },
  { user_id: ObjectId(), language: "Spanish", favorite_genres: [] }
]);

db.userProfiles.insertMany([
  { language: "English" }, // Falta user_id
  { user_id: ObjectId(), language: "German" }, // Idioma no permitido
  { user_id: "1234", language: "Spanish" }, // user_id no es ObjectId
  { user_id: ObjectId(), language: "English", favorite_genres: ["A", "A"] }, // Duplicados
  { user_id: ObjectId(), language: 123 } // language no es string
]);