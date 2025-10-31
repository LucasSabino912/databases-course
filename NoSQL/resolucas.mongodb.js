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
