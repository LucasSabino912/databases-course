/* Modelado de datos en MongoDB
7. Identificar los distintos tipos de relaciones (One-To-One, One-To-Many) en las
colecciones movies y comments. Determinar si se usó documentos anidados o
referencias en cada relación y justificar la razón. */


/* Coleccion categories
{
  _id: ObjectId(),
  category_name: "Fiction"
}

// Coleccion books
{
  _id: ObjectId(),
  title: "The Hobbit",
  author: "J.R.R. Tolkien",
  price: 25.99,
  category_id: ObjectId("...") // referencia a categories
}

// Coleccion orders anidando order details
{
  _id: ObjectId(),
  delivery_name: "Lucas Sabino",
  delivery_address: "Av. Siempreviva 123, Buenos Aires",
  cc_name: "Lucas Sabino",
  cc_number: "4111111111111111",
  cc_expiry: "12/28",
  order_details: [
    {
      book_id: ObjectId("..."), // referencia a books
      title: "The Hobbit",
      author: "J.R.R. Tolkien",
      quantity: 2,
      price: 25.99
    },
    {
      book_id: ObjectId("..."),
      title: "1984",
      author: "George Orwell",
      quantity: 1,
      price: 18.50
    }
  ]
}
*/

// Listar id, título y precio de los libros y sus categorías de un autor en particular
db.books.aggregate([
  { $match: { author: "J.R.R. Tolkien" } },
  {
    $lookup: {
      from: "categories",
      localField: "category_id",
      foreignField: "_id",
      as: "category"
    }
  },
  { $unwind: "$category" },
  {
    $project: {
      _id: 1,
      title: 1,
      price: 1,
      category_name: "$category.category_name"
    }
  }
]);

// Cantidad de libros por categoría
db.books.aggregate([
  {
    $lookup: {
      from: "categories",
      localField: "category_id",
      foreignField: "_id",
      as: "category"
    }
  },
  { $unwind: "$category" },
  {
    $group: {
      _id: "$category.category_name",
      total_books: { $sum: 1 }
    }
  },
  { $sort: { total_books: -1 } }
]);


// Nombre, dirección de entrega y monto total 
db.orders.aggregate([
  { $match: { _id: ObjectId("...") } }, // order_id buscado
  {
    $project: {
      delivery_name: 1,
      delivery_address: 1,
      total_amount: {
        $sum: {
          $map: {
            input: "$order_details",
            as: "item",
            in: { $multiply: ["$$item.quantity", "$$item.price"] }
          }
        }
      }
    }
  }
]);

// Ejemplo de inserciones

db.categories.insertMany([
  { _id: ObjectId("66f0aa001"), category_name: "Fantasy" },
  { _id: ObjectId("66f0aa002"), category_name: "Dystopian" }
]);

db.books.insertMany([
  { _id: ObjectId("66f0bb001"), title: "The Hobbit", author: "J.R.R. Tolkien", price: 25.99, category_id: ObjectId("66f0aa001") },
  { _id: ObjectId("66f0bb002"), title: "1984", author: "George Orwell", price: 18.50, category_id: ObjectId("66f0aa002") }
]);

db.orders.insertOne({
  delivery_name: "Lucas Sabino",
  delivery_address: "Av. Siempreviva 123, Buenos Aires",
  cc_name: "Lucas Sabino",
  cc_number: "4111111111111111",
  cc_expiry: "12/28",
  order_details: [
    {
      book_id: ObjectId("66f0bb001"),
      title: "The Hobbit",
      author: "J.R.R. Tolkien",
      quantity: 2,
      price: 25.99
    },
    {
      book_id: ObjectId("66f0bb002"),
      title: "1984",
      author: "George Orwell",
      quantity: 1,
      price: 18.50
    }
  ]
});


// Validación de esquema para orders

db.runCommand({
  collMod: "orders",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["delivery_name", "delivery_address", "order_details"],
      properties: {
        delivery_name: { bsonType: "string" },
        delivery_address: { bsonType: "string" },
        order_details: {
          bsonType: "array",
          minItems: 1,
          items: {
            bsonType: "object",
            required: ["book_id", "quantity", "price"],
            properties: {
              book_id: { bsonType: "objectId" },
              quantity: { bsonType: "int", minimum: 1 },
              price: { bsonType: "double", minimum: 0 }
            }
          }
        }
      }
    }
  }
});
