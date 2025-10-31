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


db.reviews.aggregate([{$group: {_id: "$address.country",average_rating: { $avg: "$review_scores.review_scores_rating" },total_count: {$count: {}}}},{$project: {country: "$_id",average_rating: 1,total_count: 1,_id: 0}},{$sort:{average_rating: -1}}]);


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

db.reviews.aggregate([{$match: {"last_review": { $ne: null, $exists: true }}},{$sort: { "last_review": -1 }},{$limit: 20}, {$project: {name: 1,last_review: 1,number_of_reviews: 1}},{$sort: { number_of_reviews: -1 }}]);

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

/* Actualizar los alojamientos de Brazil que tengan un rating global
(“review_scores.review_scores_rating”) asignado, agregando el campo
"quality_label" que clasifique el alojamiento como “High” (si el rating global es mayor
o igual a 90), “Medium” (si el rating global es mayor o igual a 70), “Low” (valor por
defecto) calidad..
HINTS: (i) para actualizar se puede usar pipeline de agregación. (ii) El operador
$cond o $switch pueden ser de utilidad */

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
