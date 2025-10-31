/* Ejercicio 1 */
db.listingsAndReviews.aggregate([
  {
    $group: {
      _id: "$address.country",
      average_rating: { $avg: "$review_scores.review_scores_rating" },
      total_count: {$count: {}}
    }
  },
  {
    $project: {
      country: "$_id",
      average_rating: 1,
      total_count: 1,
      _id: 0
    }
  },
  {
    $sort:{
      average_rating: -1
    }
  }
]);

/* Ejercicio 2 */
db.listingsAndReviews.aggregate([
  {
    $match: {
      "last_review": { $ne: null, $exists: true }
    }
  },
  {
    $sort: { "last_review": -1 }
  },
  {
    $limit: 20
  }, 
  {
    $project: {
      name: 1,
      last_review: 1,
      number_of_reviews: 1
    }
  },
  {
    $sort: { number_of_reviews: -1 }
  }
]);

/* Ejercicio 3 */
db.createView(
  "top10_most_common_amenities",
  "listingAndReviews",
  [
    { $unwind: "$amenities "},

    {
      $group: {
        _id: "$amenities",
        total_app: { $count: {} }
      }
    },
    {
      $project: {
        name: "$_id",
        count: "$total_app",
        _id: 0
      }
    }
  ]
);

/* Ejercicio 4 */
db.listingsAndReviews.updateMany(
  {
    "address.country": "Brazil",
    "review_scores.review_scores_rating": { $exists: true, $ne: null }
  },
  [
    {
      $set: {
        "quality_label": {
          $switch: {
            branches: [
              {
                case: { $gte: ["$review_scores.review_scores_rating", 90] },
                then: "High"
              },
              {
                case: { $gte: ["$review_scores.review_scores_rating", 70] },
                then: "Medium"
              }
            ],
            default: "Low"
          }
        }
      }
    }
  ]
)

/* Ejercicio 5 */
db.runCommand({
  collMod: "listingsAndReviews",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "address", "amenities", "review_scores", "reviews"], // campos obligatorios
      properties: {
        name: {
          bsonType: "string",
          description: "El campo 'name' debe ser un string."
        },
        address: {
          bsonType: "object",
          required: ["country"],
          properties: {
            country: {
              bsonType: "string",
              description: "El campo 'address.country' debe ser un string."
            }
          }
        },
        amenities: {
          bsonType: "array",
          items: {
            bsonType: "string"
          },
          description: "El campo 'amenities' debe ser un array de strings."
        },
        review_scores: {
          bsonType: "object",
          required: ["review_scores_rating"],
          properties: {
            review_scores_rating: {
              bsonType: ["int", "double"],
              description: "El campo 'review_scores_rating' debe ser int o double."
            }
          }
        },
        reviews: {
          bsonType: "array",
          items: {
            bsonType: "object"
          },
          description: "El campo 'reviews' debe ser un array de objetos."
        }
      }
    }
  },
  validationAction: "error",
  validationLevel: "strict"
});


/* Documento valido */
db.listingsAndReviews.insertOne({
  name: "Apartamento de Prueba Válido",
  address: {
    street: "Calle Válida 123",
    country: "Argentina"
  },
  amenities: ["Wifi", "Cocina", "Aire acondicionado"],
  review_scores: {
    review_scores_rating: 95.5,
    review_scores_cleanliness: 10
  },
  reviews: [
    { _id: "rev1", comments: "Excelente estadía." }
  ],
  listing_url: "http://test.com/valid"
});


/* Documento invalido falta amenitie */
db.listingsAndReviews.insertOne({
  name: "Fallo 1",
  address: {
    country: "Chile"
  },
  review_scores: {
    review_scores_rating: 88
  },
  reviews: [
    { _id: "rev2", comments: "Bien." }
  ]
});

/*  Documento invalido */
db.listingsAndReviews.insertOne({
  name: "Fallo 2",
  address: {
    country: 123456
  },
  amenities: ["Wifi"],
  review_scores: {
    review_scores_rating: "Muy Bueno"
  },
  reviews: [
    { _id: "rev3", comments: "Regular." }
  ]
});
