/*
Escribir una consulta para calcular el promedio de puntuaciones de cada clase (class_id) y compararlo con el promedio general de todas las clases. 
La consulta debe devolver un documento para cada clase que incluya el class_id, el promedio de puntuaciones de esa clase
 y un campo adicional que indique si el promedio de la clase está por encima o por debajo del promedio general de todas las clases. Los resultados deben ordenarse de manera ascendente por class_id y de manera descendente por average_score.
Estructura de cada documento del output:
{
  "class_id": <class_id>,
  "average_score": <average_score>, // puntuación promedio de esta clase
  "comparison_to_overall_average": "above" | "below" | "equal" // comparación con el promedio general de todas las clases
}

	
HINT: una de las stages usa lookup con un pipeline adentro:
       $lookup: {
           from: "grades",
           pipeline: [
              // TODO
                  ],
           as: "overall_average"
       }




// La coleccion grades es de la forma

{
  "_id": ObjectId("..."),
  "student_id": 1,
  "class_id": 101,
  "scores": [
    { "type": "exam", "score": 85.5 },
    { "type": "quiz", "score": 78.0 },
    { "type": "homework", "score": 92.0 }
  ]
}
*/

db.grades.aggregate([

  // Descompongo el array "scores" en documentos individuales.
  // Si un alumno tiene un array con varios puntajes (exam, quiz, homework),
  // esta etapa crea un documento separado por cada elemento del array.
  { $unwind: "$scores" },

  // Agrupo los documentos por class_id.
  // Dentro de cada clase, calculo el promedio de los puntajes ("scores.score").
  {
    $group: {
      _id: "$class_id", // agrupamos por el id de la clase
      average_score: { $avg: "$scores.score" } // promedio de todas las notas de esa clase
    }
  },

  // Hago un $lookup para traer el promedio general de TODAS las clases.
  // Uso un pipeline interno que:
  //   - vuelve a hacer unwind de scores para acceder a cada nota individual
  //   - agrupa todo (sin distinguir clase) y calcula el promedio global
  {
    $lookup: {
      from: "grades", // misma colección
      pipeline: [
        { $unwind: "$scores" }, // descompone todos los scores
        {
          $group: {
            _id: null, // un solo grupo para toda la colección
            overall_average: { $avg: "$scores.score" } // promedio global
          }
        }
      ],
      as: "overall_average" // guardamos el resultado en este campo
    }
  },

  // Como el resultado del lookup es un arreglo (con un solo elemento),
  // usamos $unwind para acceder directamente al valor "overall_average.overall_average"
  { $unwind: "$overall_average" },

  // Agregamos un nuevo campo "comparison_to_overall_average"
  // que indica si el promedio de la clase está por encima, por debajo o igual
  // al promedio general de todas las clases.
  {
    $addFields: { // ojo: F mayúscula
      comparison_to_overall_average: {
        $switch: { // estructura condicional con varias ramas
          branches: [
            // Si el promedio de la clase > promedio general → "above"
            { case: { $gt: ["$average_score", "$overall_average.overall_average"] }, then: "above" },
            // Si el promedio de la clase < promedio general → "below"
            { case: { $lt: ["$average_score", "$overall_average.overall_average"] }, then: "below" }
          ],
          // Si no cumple ninguna (es igual) → "equal"
          default: "equal"
        }
      }
    }
  },

  //  Selecciono solo los campos que quiero mostrar en la salida.
  //   - class_id: identificador de la clase
  //   - average_score: promedio de esa clase
  //   - comparison_to_overall_average: comparación
  {
    $project: {
      _id: 0,
      class_id: "$_id",
      average_score: 1,
      comparison_to_overall_average: 1
    }
  },

  //   ordeno los resultados:
  //   - class_id en orden ascendente (1)
  //   - average_score en orden descendente (-1)
  {
    $sort: { class_id: 1, average_score: -1 }
  }

]);

/*
Actualizar los documentos en la colección grades, ajustando todas las puntuaciones para que estén normalizadas entre 0 y 7
La fórmula para la normalización es:

Por ejemplo:
Si un estudiante sacó un 32 y otro sacó un 62, deberían ser actualizadas a:
2,24, porque (32/100)*7 = 2,24
4,34, porque (62/100)*7 = 4,34
	
HINT: usar updateMany junto con map */

db.grades.updateMany(
  {}, // Aplico a todos los documentos
  [
    {
      $set: { // set para modificar y/o crear campos en los documentos
        scores: { // reemplaza el array scores
          $map: { // map recorre todos los elementos del array y devuelve un nuevo array
            input: "$scores", // input: array que quiero recorrer
            as: "s", 

            in: { // define como sera cada elemento del array
              type: "$$s.type", // Conservo el tipo

              // Puntuacion normalizada
              score: {
                $multipy: [
                  { $divide: ["$$s.score", 100] }, // Decide el puntaje original
                  7 // Multiplica por 7
                ]
              }
            }
          }
        }
      }
    }
  ]
)

/* Crear una vista "top10students_homework" que liste los 10 estudiantes con los mejores promedios 
   para homework. Ordenar por average_homework_score descendiente. */

db.createView(
  "top10students_homework", // Nombre de la vista
  "grades", // Coleccion base
  [
    // Separo el array scores
    { $unwind: "$scores"},

    // Me quedo con los elementos cuyo tipo sea homework
    { $match: { "scores.type": "homework" } },

    // Agrupo por student_id para calcular el promedio
    {
      $group: {
        _id: "$student_id",
        average_homework_score: { $avg: "$scores.score" }
      }
    },
    // Ordenamos de mayor a menor promedio
    { $sort: { average_homework_score: -1 } },

    // Tomo solo los 10 mejores
    { $limit: 10 },

    // Renombra los campos para que se vean más claros
    {
      $project: {
        _id: 0,
        student_id: "$_id",
        average_homework_score: 1
      }
    }
  ]
)

/* Especificar reglas de validación en la colección grades. 
El único requerimiento es que se valide que los type de los scores sólo puedan ser 
de estos tres tipos: [“exam”, “quiz”, “homework”]
 */

db.runCommand({
  collMod: "grades", // nombre de la colección
  validator: {
    $jsonSchema: {
      bsonType: "object", // cada documento debe ser un objeto
      required: ["scores"], // el campo scores debe existir
      properties: {
        scores: {
          bsonType: "array", // debe ser un array
          items: {
            bsonType: "object", // cada elemento del array debe ser un objeto
            required: ["type", "score"], // cada objeto debe tener estos campos
            properties: {
              type: {
                bsonType: "string",
                enum: ["exam", "quiz", "homework"] // 🔥 solo estos tres valores son válidos
              },
              score: {
                bsonType: ["double", "int"], // el score debe ser numérico
                minimum: 0,
                maximum: 100 // opcional: puedes limitar el rango también
              }
            }
          }
        }
      }
    }
  },
  validationLevel: "strict", // aplica siempre
  validationAction: "error"  // si no cumple, genera error al insertar/actualizar
});


// Si la coleccion no exsite
db.createCollection("grades", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["scores"],
      properties: {
        scores: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["type", "score"],
            properties: {
              type: {
                bsonType: "string",
                enum: ["exam", "quiz", "homework"]
              },
              score: {
                bsonType: ["double", "int"],
                minimum: 0,
                maximum: 100
              }
            }
          }
        }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error"
});
