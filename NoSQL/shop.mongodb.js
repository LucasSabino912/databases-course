/**
 * Dado el diagrama de la base de datos shop junto con las queries más importantes.
 */

/**
 * orders table:
 *  Stores customer order information
 *  Contains delivery details and credit card information
 *  Primary key: order_id
 * 
 * categories table:
 *  Stores book categories
 *  Primary key: category_id
 * 
 * order_details table:
 *  Stores individual items within each order
 *  Contains book information and quantities
 *  Foreign key: order_id links to orders table
 * 
 * books table:
 *  Master catalog of available books
 *  Contains pricing and categorization
 *  Foreign key: category_id links to categories table
 * 
 * Relationships
 *  orders ← order_details (one-to-many)
 *  categories → books (one-to-many)
 *  books information is duplicated in order_details to preserve order snapshot
 */

/**
 * Queries
 * I. Listar el id, titulo, y precio de los libros y sus categorías de un autor en particular
 * II. Cantidad de libros por categorías
 * III. Listar el nombre y dirección entrega y el monto total (quantity * price) de sus
 *      pedidos para un order_id dado.
 */

use("shop");
db.createCollection("orders");
db.createCollection("books");

db.orders.insertOne({
  _id: 1,
  delivery_name: "sabin",
  delivery_address: "lucas.plata.gracias",
  cc_name: "TheKillerCR",
  cc_number: "44553764",
  cc_expiry: "manaña",
  order_details:[
    {book_id: 1, quantity: 1, price: 18.1},
    {book_id: 1, quantity: 2, price: 18.1}
  ]
});

db.books.insertOne({
  _id: 1,
  title: "luismi: un sol",
  author: "lucas sabino",
  price: 18.1,
  category: "Romance"
});

db.books.find({author: "lucas sabino"},{
  title:1,
  price: 1,
  category: 1
});

db.books.aggregate([
  {$group: {
    _id: "$category",
    count: { $count: {}}
  }}
])

db.orders.aggregate([
  {$match: {_id: 1}},
  {
    $project: {
      name: "$delivery_name",
      address: "$delivery_address",
      order_details: {
        $map: {
          input: "$order_details",
          as: "item",
          in: {
            title: "$$item.title",
            quantity: "$$item.quantity",
            price: "$$item.price",
            subtotal: { $multiply: ["$$item.quantity", "$$item.price"] }
          }
        }
      },
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


