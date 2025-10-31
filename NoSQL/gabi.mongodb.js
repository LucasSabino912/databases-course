use("sample_airbnb");

/**
 * 1. 
 * Calcular el rating promedio por país. 
 * Listar el país, rating promedio, y cantidad de rating. 
 * Listar en orden descendente por rating promedio. 
 * Usar el campo “review_scores.review_scores_rating” para calcular el rating promedio.
 */

db.listingsAndReviews.aggregate([
  {
    $group: {
      _id: "$address.country",
      average_rating: {
        $avg: "$review_scores.review_scores_rating"
      },
      count: {$count: {}} //  cantidad de rating
    }
  },
  {
    $project: {
      country: "$_id",
      average_rating:1,
      count:1,
      _id:0
    }
  },
  {
    $sort:{
      average_rating:-1
    }
  }
]);

/** 
 * 2. Listar los 20 alojamientos que tienen las reviews más recientes. Listar el id, nombre,
 * fecha de la última review, y cantidad de reviews del alojamiento. Listar en orden
 * descendente por cantidad de reviews.
 * HINT: $first pueden ser de utilidad.
 */

/** 
 * 3. Crear la vista “top10_most_common_amenities” con información de los 10 amenities
 * que aparecen con más frecuencia. El resultado debe mostrar el amenity y la
 * cantidad de veces que aparece cada amenity.
 */ 
 /** 
  * 4. Actualizar los alojamientos de Brazil que tengan un rating global
  * (“review_scores.review_scores_rating”) asignado, agregando el campo
  * "quality_label" que clasifique el alojamiento como “High” (si el rating global es mayor
  * o igual a 90), “Medium” (si el rating global es mayor o igual a 70), “Low” (valor por
  * defecto) calidad..
  * HINTS: 
  * (i) para actualizar se puede usar pipeline de agregación. 
  * (ii) El operador $cond o $switch pueden ser de utilidad.
  */

/** 
 * 5. 
 * (a) Especificar reglas de validación en la colección listingsAndReviews a los
 * siguientes campos requeridos: name, address, amenities, review_scores, and
 * reviews ( y todos sus campos anidados). Inferir los tipos y otras restricciones que
 * considere adecuados para especificar las reglas a partir de los documentos de la
 * colección.
 * (b) Testear la regla de validación generando dos casos de fallas en la regla de
 * validación y un caso de éxito en la regla de validación. Aclarar en la entrega cuales
 * son los casos y por qué fallan y cuales cumplen la regla de validación. Los casos no
 * deben ser triviales, es decir los ejemplos deben contener todos los campos
 * especificados en la regla.
 */