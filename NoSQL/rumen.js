// Comandos básicos
  show (dbs)
    //  Lista todas las bd en el servidor
  use (db)
    //  Cambia la base de datos actual a {db}
  db
    //  Variable que representa la base de datos actual luego de ejecutar el comando use
  show (collections)
    // Lista todas las colecciones de la base de datos actual
  db.createCollection(collection_name, {options})
    //  Crea una nueva colección
  db.collection.help()
    //  Muestra ayuda sobre los métodos de la colección


//  Crud

db.collection.insertOne({document})
db.collection.insertMany([{doc1}, /*…*/, {docN}])
db.collection.findOne( {query}, {projection})
db.collection.find(query, projection, options)
  //  query: matchea documentos       {name: "luismi"}
  //  https://www.mongodb.com/docs/manual/reference/mql/query-predicates/#std-label-query-projection-operators-top
  //  projection: campos returneados  {name: true}
  //  options: sort, limit, skip, hint, batchSize, maxTimeMS, collation, allowDiskUse
  //  https://www.mongodb.com/docs/manual/reference/method/db.collection.find/#std-label-find-options
db.collection.updateOne({query}, {update}, {options})
db.collection.updateMany({query}, {update}, {options})
db.collection.deleteOne({query})
db.collection.deleteMany({query})


//  agregación

db.collection.aggregate(pipeline, {options})
db.collection.aggregate([{stage1}, /*…*/, {stageN}], {options})
  //  retuns:
  //    A cursor for the documents produced by the final stage of pipeline.
  //    If the pipeline includes the explain option, the query returns a document that provides details on the processing of the aggregation operation.
  //    If the pipeline includes the $out or $merge operators, the query returns an empty cursor.

//  aggregation expressions
  boolean: 
//  $and $not $or
  comparation: 
//  $cmp $eq $gt $gte $lt $lte $ne
  aritmeticas:
//  $add $subtract $divide $abs …
  arrays:
//  $arrayElemAt $first $last $size …
//  $concatArray $filter $map $reduce …
  conjuntos:
//  $setDifference $setUnion $setIsSubset …
  conditionals:
//  $cond $ifNull $switch
  fechas:
//  $year $month $dateAdd $dateDiff …
  strings: 
//  $concat $split $substr $dateFromString …
  types:
//  $convert $isNumber $type …
  field_path:
//  "$<field>" (= "$$CURRENT.<field>")

stages:

$match
//   Filtra los documentos que pasan a la siguiente etapa
  {$match: {query_filter}}
  {$match: {$expr: aggregation_expression}}

$project
//   Cambia la forma de cada documento
//    incluye/omite campos o agrega nuevos 

$skip
//   Omite los primero N documentos

$limit
//   Limita el resultado a los primeros N documentos

$sort
//   Ordena el flujo de documentos por uno o más campos

$count
//   Retorna la cantidad de documentos

$addFields
//   Agrega nuevos campos a cada documento

$unwind
//   Deconstruye un campo arreglo en el documento y crea documentos separados para cada elemento en el arreglo

$replaceRoot
//   Reemplaza el documento por un documento anidado especificado

$group
//   Agrupa los documentos por una expresión especificada y aplica las expresiones acumuladoras
//   https://www.mongodb.com/docs/manual/reference/operator/aggregation/group/#std-label-accumulators-group

$unionWith
//   Realiza la unión de dos colecciones
  { $unionWith: "<collection>" }
//  { $unionWith: { coll: "<collection>", pipeline: [ { <stage1> }, … ] } }

$out
//   Almacena el resultado del pipeline en una colección
//  { $out: { db: "<outDatabase>", coll: "<outCollection>"} }

$lookup
//   Realiza un left join a otra colección

//  $lookup: {from: <collection to join>, 
// localField: <field from the input documents>
// foreignField: <field from the documents of the "from" collection>,
// as : <output array field>} 

// $lookup: {
// from: <joined collection>,
// let: { <var1>: <expression>, … , <varN>: <expression> },
// pipeline: [ <pipeline to run joined collection> ],
// as : <output array field> } 


//  Vistas
db.createView( "viewName", "source", pipeline)


//  validación de esquemas

//  crear collection con validacion
db.createCollection( "<name>", {validator: document, validationLevel: string, validationAction: string})

//  agregat validación a collección existente
db.runCommand({collMod: "<name>", validator: document, validationLevel: string, validationAction: string})

//  validationLevel : 
//    especificar cómo aplicar las reglas de validación a documentos ya existentes
//      strict: (valor por defecto) Las reglas de validación se aplican a todos los inserts y updates.
//      moderate : Las reglas de validación solo se aplican a los documentos existentes válidos.

//  validationAction : 
//    permiten especificar cómo manejar los documentos que no cumplen la validación
//      error: (valor por defecto) MongoDB rechaza cualquier insert o update que no cumple la regla de validación
//      warn: MongoDB permite que operación continúe, pero registra la infracción en los logs de MongoDB

//  JSON
//  JSONSchema
{ $jsonSchema: JSON_Schema_object};
{ $jsonSchema: {/*keyword_1: v1, …, keyword_n: vn*/}}

// keywords
//  bsonType
//    Acepta los mismos alias en string usados por el operador $type
//  required
//    El documento debe contener todos los elementos especificados en el arreglo
//  properties
//    Un esquema JSON válido donde cada valor es un esquema JSON válido
//  additionalProperties
//    Especifica si se permiten campos adicionales
//  minimum, maximum
//    Indica el valor mínimo (máximo) del campo
//  minItems, maxItems
//    Indica la longitud mínima (longitud máxima) del arreglo
//  otros keywords
//    enum, description, pattern, minLength, maxLength, uniqueItems
//  https://www.mongodb.com/docs/manual/reference/operator/query/jsonSchema/#mongodb-query-op.-jsonSchema
//  https://www.mongodb.com/docs/manual/core/schema-validation/specify-json-schema/json-schema-tips/#std-label-json-schema-tips


//  Estrategias de modelado de datos
//   Decisión clave para el modelado de relaciones
//    Anidar (embed) datos VS. usar Referencias (references)

//  Modelo anidado
Person = {
  _id: "153499",
  name: { first: "Joe", last: "Moore" },
  age: 22,
  //  embed
  pets: [{name: "Bark", type: "Dog", w: 10}, {name: "Fluffy", type: "Cat", w: 5}]
}

//  modelo con referencias
Product = {
  _id: "1",
  name: "Super Widget",
  desc: "This is the most useful item …",
  price: 119.99
}

Review = {
  review_id: "678",
  //  reference
  product_id: 1,
  author: "Nicole",
  text: "This is indeed an amazing widget.",
  published_date: ISODate("2019-02-18")
}

//  Principio General in MongoDB
//    Datos que se accede juntos deben ser almacenado juntos 

// Embedding
//  ventajas:
//    Una sola query para recuperar datos
//    Una sola operación para update/delete data
//  desventajas:
//    Duplicación de datos
//    Documentos grandes
// Referencing
//  ventajas:
//    Puede evitar duplicación de datos
//    Documentos más pequeños 
//  desventajas:
//    Se necesita join a nivel de aplicación

// Modelado de Datos Dirigido por Queries
//  Identificar entidades, atributos y relaciones
//  Identificar las queries importantes
//   Y analizar la carga de trabajo de las queries (por ejemplo, frecuencia y latencia)
//  Crear el modelo de datos aplicando las estrategias Anidar datos y Referencias
//   Hay que tener en mente las queries más importantes para crear el modelo de datos.
//   El modelo de datos debe permitir satisfacer las queries o patrones de acceso más importantes de manera eficiente

//  Para este curso, una “consulta es eficiente” si se puede responder en un sola query sin $lookup

