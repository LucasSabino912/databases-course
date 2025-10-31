/* Ejercicio 1 */

db.listingsAndReviews.aggregate([
  {
    $group: {
      _id: "$address.country",
      average_rating: { $avg: "$review_scores.review_scores_rating" },
      total_count: {$count: {}} // Total rating
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

/** 
 * 2. Listar los 20 alojamientos que tienen las reviews más recientes. Listar el id, nombre,
 * fecha de la última review, y cantidad de reviews del alojamiento. Listar en orden
 * descendente por cantidad de reviews.
 * HINT: $first pueden ser de utilidad.
 */