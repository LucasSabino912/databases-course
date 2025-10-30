/* global use, db */
// MongoDB Playground

//  ejemplo completo aggregate
db.createCollection("survey");
db.createCollection("sales");
db.createCollection("monthlyBudget");
db.createCollection("cats");
db.createCollection("dogs");
db.createCollection("posts");
db.createCollection("comments");
db.createCollection("students");
db.createCollection("contacts");
db.createCollection("customer");

db.contacts.insertMany([
  {"_id": 1, "name": "Anne", "phone": "+1 555 123 456", "city": "London", "status": "Complete"},
  {"_id": 2, "name": "Ivan", "city": "Vancouver"}
]);

db.students.insertMany( [
  { sID: 22001, name: "Alex", year: 1, score: 4.0 },
  { sID: 21001, name: "bernie", year: 2, score: 3.7 },
  { sID: 20010, name: "Chris", year: 3, score: 2.5 },
  { sID: 22021, name: "Drew", year: 1, score: 3.2 },
  { sID: 17301, name: "harley", year: 6, score: 3.1 },
  { sID: 21022, name: "Farmer", year: 1, score: 2.2 },
  { sID: 20020, name: "george", year: 3, score: 2.8 },
  { sID: 18020, name: "Harley", year: 5, score: 2.8 },
]);

db.comments.insertMany( [
  { "comment": "great read", "likes": 3, post_id: 1 },
  { "comment": "good info", "likes": 0, post_id: 2 },
  { "comment": "i liked this post", "likes": 12, post_id: 2 },
  { "comment": "not my favorite", "likes": 8, post_id: 3 },
  { "comment": null, "likes": 0, post_id: 4 }
]);

db.posts.insertMany( [
  { _id: 1, "author": "Jim", "likes": 5 },
  { _id: 2, "author": "Jim", "likes" : 2 },
  { _id: 3, "author": "Joe", "likes": 3 }
]);

db.cats.insertMany([
  {_id: 1, name: "Fluffy", type: "Cat", weight: 5},
  {_id: 2, name: "Scratch", type: "Cat", weight: 3},
  {_id: 3, name: "Meow", type: "Cat", weight: 7}
]);

db.dogs.insertMany([
  {_id: 1, name: "Wag", type: "Dog", weight: 20},
  {_id: 2, name: "Bark", type: "Dog", weight: 10},
  {_id: 3, name: "Fluffy", type: "Dog", weight: 40}
]);

db.sales.insertMany([
  { _id: 1, item: "b", price: 10, qty: 2, date: ISODate("2014-03-01T08:00:00Z") },
  { _id: 2, item: "d", price: 20, qty: 1, date: ISODate("2014-03-01T09:00:00Z") },
  { _id: 3, item: "a", price: 5, qty: 10, date: ISODate("2014-03-15T09:00:00Z") },
  { _id: 4, item: "a", price: 5, qty: 20, date: ISODate("2014-04-04T11:21:39Z") },
  { _id: 5, item: "b", price: 10, qty: 10, date: ISODate("2014-04-04T21:23:13Z") },
  { _id: 6, item: "c", price: 7.5, qty: 5, date: ISODate("2015-06-04T05:08:13Z") },
  { _id: 7, item: "c", price: 7.5, qty: 10, date: ISODate("2015-09-10T08:43:00Z") },
  { _id: 8, item: "b", price: 10, qty: 5, date: ISODate("2016-02-06T20:20:13Z") }
]);

db.monthlyBudget.insertMany([
  { _id: 1, category: "food", budget: 400, spent: 450 },
  { _id: 2, category: "drinks", budget: 100, spent: 150 },
  { _id: 3, category: "clothes", budget: 100, spent: 50 },
  { _id: 4, category: "misc", budget: 500, spent: 300 },
  { _id: 5, category: "travel", budget: 200, spent: 650 }
]);  

db.survey.insertMany([
  {results: [{product: "b", score: 10}, {product: "a", score:5}]},
  {results: [{product: "b", score: 9}, {product: "a", score: 8}]},
  {results: [{product: "b", score: 6}, {product: "a", score: 3}]}
]);  

db.monthlyBudget.aggregate([
  // $match
  {
    //  spent > budget
    $match: {$expr: {$gt: ["$spent", "$budget"]}}
  },  

  // $addFields - Add additional calculated fields
  {
    $addFields: {
    //  agrega field "excess": spent - budget  
      excess: {$subtract: ["$spent", "$budget"]}
    }  
  },  
  {
    $addFields: {
      //  "excess_percentage" = "excess" / ("budget" != null ? "budget" : 1) * 100
      excess_percentage: {
        $multiply: [{$divide: ["$excess", {$ifNull: ["$budget", 1] }]}, 100]
      },  
      //  "status" = "Over Budget"
      status: "Over Budget",
      //  $$NOW = new Date()
      timestamp: "$$NOW"
    }  
  },  

  // $project - incluye/oculta fields existentes o agrega nuevos 
  {
    $project: {
      //  agrega field "cat_prefix": primeros 3 caracteres de "category"
      cat_prefix: {$substr: ["$category", 0, 3]},
      //  inclusiones, exclusiones
      excess: 1,
      excess_percentage: 1,
      status: 1,
      timestamp: 1,
      _id: 0
      //  los otros campos son ignorados automáticamente
    }  
  },  
  
  // $sort
  {
    $sort: {excess: -1}
  },  
  
  // $skip - Skip first document
  {
    $skip: 1
  },  
  
  // $limit - Limit to 1 document
  {
    $limit: 1
  },  

  // $count - Count remaining documents
  {
    $count: "final_result_count"  // devuelve siempre 1
  }  
])  

//  unwind

db.survey.aggregate([
  //  hace un documento por cada item en campo "results"
  {$unwind: "$results"},
]);  

//  replaceRoot

db.survey.aggregate([
  {$unwind: "$results"},
  // Reemplaza por "results", espera un objeto
  {$replaceRoot: {newRoot: "$results"}}
]);  

//  group

db.survey.aggregate([
  {$unwind: "$results"},
  //  agrupa por lo que se pone en _id, los demas campos usan acumuladores
  {$group: { _id: "$results.product",
    promedioScore: { $avg: "$results.score" },  // Calcula promedio
    count: { $count: {}},
    totalEncuestas: { $sum: 1 },                // Cuenta documentos
    maxScore: { $max: "$results.score" },       // Score máximo
    minScore: { $min: "$results.score" }         // Score mínimo
  }}  
]);  

db.survey.aggregate([
  {$unwind: "$results"},
  //  agrupa por lo que se pone en _id
  {$group: {
      _id: {$toString: "$_id"},       // Convierte ObjectId a string 
      results: { $push: "$results" }  // Acumulador que crea un array
  } }    
]);  

db.sales.aggregate([
  {$group: 
    { 
      _id: "$item",
      amount: {$sum: {$multiply: ["$price", "$qty"]}},
    }
  }
]);

db.sales.aggregate([
  {$group:
    {
      //  extrae $year o $month de $date
      _id: {"year": {$year: "$date"}, month: {$month: "$date"}},
      totalQuantity: {$sum: "$qty"},
      count: {$sum: 1}
    }
  }
]);

// unionWith

db.cats.aggregate( [
  {$unionWith: 
    {
      coll: "dogs",
      pipeline: [{$match: {weight: {$lt: 30}}}]
    }
  }
]);

// out

db.cats.aggregate([
  {$unionWith: 
    {
      coll: "dogs",
      pipeline: [{$match: {weight: {$lt: 30}}}]
    }
  },
  {$unset: "_id" },
  {$out: { db: "test", coll: "pets" }}
]);
db.pets.find();

//  lookup

db.posts.aggregate([
  //  cuando coinciden "localField" y "foreignField" agrega campo "as" con todo lo de "from"
  {$lookup: 
    {
      from: "comments",
      localField: "_id",
      foreignField: "post_id",
      as: "cmts"
    }
  }
]);

db.posts.aggregate([
  {$lookup: 
    {
      from: "comments",
      let: {post_likes: "$likes", post_id: "$_id"},
      pipeline: [
        {$match: 
          //  matchea si comments.post_id == posts._id  y comments.likes > posts.likes
          {$expr: {$and: 
            [
              {$eq: ["$post_id", "$$post_id"]}, 
              {$gt: [ "$likes", "$$post_likes"]}
            ]
          }}
        }
      ],
      as: "cmts"
    }
  }
]);

//  views

db.createView(
  "firstYears",
  "students",
  [{$match: {year: 1}}]
);
db.firstYears.find({}, {_id: 0});

//  Validación de Esquemas JSON

db.createCollection("employees", 
  {validator: 
    {$jsonSchema: 
      {
        bsonType: "object",
        required: [ "name", "age" ],
        properties: 
        {
          name: 
          { 
            bsonType: "string",
            minLength: 3,
            description: "full name of the employee and is required"
          },
          age: 
          {
            bsonType: "int",
            minimum: 16,
            description: "age of the employee and is required"
          },
          category: 
          {
            enum: [ "Full-time","Part-time", "Temporary" ],
            description: "can only be one of the enum values if the field exists"
          }
        }
      }
    }
  }
);

// db.employees.insertOne( { name: "Kate MacDonell", category:"Full-time" } ) fails

db.employees.insertOne({name: "Kate MacDonell", age: 21, category: "Part-time"});

db.createCollection("orders",
  {validator: 
    {$expr: 
      {
        $eq: [
          "$totalWithIVA",
          {$multiply: [ "$total", "$IVA"]}
        ]
      }
    }
  }
);

//  db.orders.insertOne({total: NumberDecimal("4000"), IVA: NumberDecimal("1.21"), totalWithIVA: NumberDecimal("4800")})
db.orders.insertOne({
  total: NumberDecimal("4000"),
  IVA: NumberDecimal("1.21"),
  totalWithIVA: NumberDecimal("4840")
});

db.runCommand({collMod: "contacts", validator: 
  {$jsonSchema: 
    {
      bsonType: "object",
      required: [ "phone", "name" ],
      properties: {
        phone: {
          bsonType: "string",
          description: "phone must be a string and is required"
        },
        name: {
          bsonType: "string",
          description: "name must be a string and is required"
        }
      }
    }
  },
  validationLevel: "moderate",
  validationAction: "error"
});

//  db.contacts.updateOne({"_id": 1}, {$set: {phone: null}}) 
// falla porque tiene telefono

db.contacts.updateOne(
  {"_id": 2},
  {$set: {phone: null}}
);

let collección = "pets";
db.getCollectionInfos({name: collección});

//  modelado de datos
/*
Query 1:
  Listar el id, nombre, apellido y teléfonos (número y tipo) de los clientes
    ○ Entidades: customer y phone_numbers
    ○ Relación: One-To-Many
    ○ Estrategia: Documentos Anidados

Query 2:
  Listar los clientes (nombre, apellido y email) de una ciudad en particular
    ○ Entidades: customer, address, city, y country
    ○ Relación: One-To-Many (entre customer y address)
    ○ Estrategia: Documentos Anidados

Query 3:
  Listar los clientes (nombre, apellido y email) interesados en un tópico en particular
    ○ Entidades: customer, interests, topics
    ○ Relación: Many-To-Many (entre customer y topics)
    ○ Estrategia: Documentos Anidados
*/

db.customer.insertOne( {
  customer_id: "1",
  name: { first: "John", last: "Moore" },
  email: "jmoore@example.com",
  annual_spend: 50000,
  phone_numbers: [
    {
      type: "Home",
      number: "238479823749"
    }
  ],
  addresses: [
    {
      address: "sample address",
      address2: "sample address2",
      district: "sample district",
      city: "sample city",
      country: "sample country",
      postal_code: "79878",
      location: "sample location"
    }
  ],
  topics: [ "topic 1", "topic 2" ]
});

// Query 1
db.customer.find({}, {customer_id: 1, name: 1, phone_numbers: 1, _id:0});

// Query 2
db.customer.find(
  { 
    addresses: {
      $elemMatch: { city: "sample city", country: "sample country"}
    } 
  },
  {name: 1, email: 1, _id:0}
);
// Query 3
db.customer.find({topics: {$in: ["topic 1"]}}, {name: 1, email: 1, _id:0});