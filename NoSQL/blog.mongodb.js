/**
 * Dado el siguiente diagrama que representa los datos de un blog de artículos
 * 
 * Users = (_id, name, email)
 * Articles = (_id, user_id, title, date, text, url)
 * Categories = (_id, name)
 * Comments = (_id, user_id, date, text)
 * Tags = (_id, name)
 * 
 * articles need tags, categories and only one user, can have comments
 * comments need one article and one user
 * categories and tags need articles
 * users can have articles and comments
 * 
 * Se pide
 *    a. Crear 3 modelos de datos distintos en mongodb aplicando solo las estrategias
 *      “Modelo de datos anidados” y Referencias (es decir, sin considerar queries).
 *    b. Crear un modelo de datos en mongodb aplicando las estrategias “Modelo de
 *      datos anidados” y Referencias y considerando las siguientes queries.
 *          i. Listar título y url, tags y categorías de los artículos dado un user_id
 *          ii. Listar título, url y comentarios que se realizaron en un rango de fechas.
 *          iii. Listar nombre y email dado un id de usuario
 *      Inserte algunos documentos para las colecciones del modelo de datos.
 *      Opcionalmente puede especificar una regla de validación de esquemas para las colecciones..
 */


use("blog")

const collections = ["usersR", "categoriesR", "tagsR", "articlesR", "commentsR", "articlesFull", "usersH", "articlesH"];
for (let i = 0; i < collections.length; i++) {
  db.createCollection(collections[i]);
}

//  Modelo 1: Todo Referenciado
db.usersR.insertOne({
  "_id": ObjectId("656f1a7e1c9ddc21ea1ce004"),
  "name": "Juan Perez",
  "email": "juan@example.com"
})

db.categoriesR.insertOne({
  "_id": ObjectId("656f1b001c9ddc21ea1ce005"),
  "name": "Tecnología"
})

db.tagsR.insertOne({
  "_id": ObjectId("656f1b351c9ddc21ea1ce006"),
  "name": "MongoDB"
})

db.articlesR.insertOne({
  "_id": ObjectId("656f1b821c9ddc21ea1ce007"),
  "user_id": ObjectId("656f1a7e1c9ddc21ea1ce004"),
  "title": "Introducción a MongoDB",
  "date": ISODate("2025-10-30T10:00:00Z"),
  "text": "MongoDB es una base de datos...",
  "url": "https://blog.com/intro-mongodb",
  "categories": [ObjectId("656f1b001c9ddc21ea1ce005")],
  "tags": [ObjectId("656f1b351c9ddc21ea1ce006")]
})

db.commentsR.insertOne({
  "_id": ObjectId("656f1be71c9ddc21ea1ce008"),
  "user_id": ObjectId("656f1a7e1c9ddc21ea1ce004"),
  "article_id": ObjectId("656f1b821c9ddc21ea1ce007"),
  "date": ISODate("2025-10-30T12:00:00Z"),
  "text": "Excelente artículo!"
})

//  Modelo 2: Anidado en Articles

db.articlesFull.insertOne({
  "_id": ObjectId("656f1c301c9ddc21ea1ce009"),
  "user": {
    "_id": ObjectId("656f1c401c9ddc21ea1ce010"),
    "name": "Ana Gomez",
    "email": "ana@example.com"
  },
  "title": "Bases de datos NoSQL",
  "date": ISODate("2025-10-28T09:00:00Z"),
  "text": "El ecosistema NO SQL...",
  "url": "https://blog.com/nosql",
  "categories": [
    {"_id": ObjectId("656f1c711c9ddc21ea1ce011"), "name": "Bases de datos"}
  ],
  "tags": [
    {"_id": ObjectId("656f1c911c9ddc21ea1ce012"), "name": "NoSQL"},
    {"_id": ObjectId("656f1ca61c9ddc21ea1ce013"), "name": "Escalabilidad"}
  ],
  "comments": [
    {
      "_id": ObjectId("656f1cbf1c9ddc21ea1ce014"),
      "user": {
        "_id": ObjectId("656f1cdb1c9ddc21ea1ce015"),
        "name": "Carlos López",
        "email": "carlos@example.com"
      },
      "date": ISODate("2025-10-29T14:15:00Z"),
      "text": "Muy útil la explicación"
    }
  ]
})

//  Modelo 3: Híbrido

db.usersH.insertOne({
  "_id": ObjectId("656f1d151c9ddc21ea1ce016"),
  "name": "Luis Torres",
  "email": "luis@example.com"
})

db.articlesH.insertOne({
  "_id": ObjectId("656f1d3e1c9ddc21ea1ce017"),
  "user_id": ObjectId("656f1d151c9ddc21ea1ce016"),
  "title": "Ventajas de los documentos JSON",
  "date": ISODate("2025-10-27T16:05:00Z"),
  "text": "JSON como formato...",
  "url": "https://blog.com/ventajas-json",
  "categories": [
    {"_id": ObjectId("656f1d661c9ddc21ea1ce018"), "name": "Data"}
  ],
  "tags": [
    {"_id": ObjectId("656f1d801c9ddc21ea1ce019"), "name": "JSON"}
  ],
  "comments": [
    {
      "_id": ObjectId("656f1da31c9ddc21ea1ce020"),
      "user_id": ObjectId("656f1d151c9ddc21ea1ce016"),
      "date": ISODate("2025-10-28T10:30:00Z"),
      "text": "Me gustó el ejemplo."
    }
  ]
})

//  b
use("blog")

db.createCollection("articles", {
  validator: {
    $jsonSchema: {
      "bsonType": "object",
      "required": ["user_id", "title", "date", "url", "categories", "tags"],
      "properties": {
        "user_id": { "bsonType": "objectId" },
        "title": { "bsonType": "string" },
        "date": { "bsonType": "date" },
        "text": { "bsonType": "string" },
        "url": { "bsonType": "string" },
        "categories": {
          "bsonType": "array",
          "items": {
            "bsonType": "object",
            "required": ["_id", "name"],
            "properties": {
              "_id": { "bsonType": "objectId" },
              "name": { "bsonType": "string" }
            }
          }
        },
        "tags": {
          "bsonType": "array",
          "items": {
            "bsonType": "object",
            "required": ["_id", "name"],
            "properties": {
              "_id": { "bsonType": "objectId" },
              "name": { "bsonType": "string" }
            }
          }
        }
      }
    }
  }
})

db.createCollection("comments", {
  validator: {
    $jsonSchema: {
      "bsonType": "object",
      "required": ["article_id", "article_title", "article_url", "user_id", "date", "text"],
      "properties": {
        "article_id": { "bsonType": "objectId" },
        "article_title": { "bsonType": "string" },
        "article_url": { "bsonType": "string" },
        "user_id": { "bsonType": "objectId" },
        "date": { "bsonType": "date" },
        "text": { "bsonType": "string" }
      }
    }
  }
})

db.createCollection("users", {
  validator:{
    $jsonSchema: {
      "bsonType": "object",
      "required": ["name", "email"],
      "properties": {
        "name": { "bsonType": "string" },
        "email": { "bsonType": "string" }
      }
    }
  }
})

db.users.insertOne({
  "_id": ObjectId("656f1df31c9ddc21ea1ce022"),
  "name": "Sofía Ramírez",
  "email": "sofia@example.com"
})

db.articles.insertOne({
  "_id": ObjectId("656f1dd51c9ddc21ea1ce021"),
  "user_id": ObjectId("656f1df31c9ddc21ea1ce022"),
  "title": "Tendencias en Big Data",
  "date": ISODate("2025-10-25T08:20:00Z"),
  "text": "Datos masivos...",
  "url": "https://blog.com/tendencias-bigdata",
  "categories": [
    {"_id": ObjectId("656f1e0b1c9ddc21ea1ce023"), "name": "Big Data"}
  ],
  "tags": [
    {"_id": ObjectId("656f1e1c1c9ddc21ea1ce024"), "name": "Analytics"}
  ]
})

db.comments.insertOne({
  "_id": ObjectId("656f1e321c9ddc21ea1ce025"),
  "article_id": ObjectId("656f1dd51c9ddc21ea1ce021"),
  "article_title": "Tendencias en Big Data",
  "article_url": "https://blog.com/tendencias-bigdata",
  "user_id": ObjectId("656f1df31c9ddc21ea1ce022"),
  "date": ISODate("2025-10-27T11:22:00Z"),
  "text": "Interesante enfoque."
})

db.articles.find(
  { user_id: ObjectId("656f1df31c9ddc21ea1ce022") },
  { title: 1, url: 1, tags: 1, categories: 1 }
)

use("blog")
db.comments.find(
  { date: { $gte: ISODate("2025-10-26T00:00:00Z"), $lte: ISODate("2025-10-28T23:59:59Z") } },
  { article_title: 1, article_url: 1, text: 1, date: 1 }
)

db.users.findOne(
  { _id: ObjectId("656f1df31c9ddc21ea1ce022") },
  { name: 1, email: 1 }
)
