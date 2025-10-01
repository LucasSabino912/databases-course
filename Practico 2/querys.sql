use world;

-- Devolver una lista de los nombres y las regiones a las que pertenece cada pais ordenada alfabeticamente
select Name, Region
from country
order by Region asc;

-- Listar nombre y poblacion de las 10 ciudades mas pobladas del mundo
select Name, Population
from city
order by Population desc
limit 10;

-- Listar nombre, region, superficie y forma de gobierno de los 10 paises con menor superficie
select Name, Region, SurfaceArea, GovernmentForm
from country
order by SurfaceArea asc
limit 10;

-- Listar todos los paises que no tienen independencia (ver como se define la independencia en la BD)

-- Primero veo como se define la independencia
select Name, IndepYear
from country
limit 20;


-- Veo que cuando no tiene inedependencia se define como NULL =>
select * 
from country
where IndepYear is null;


-- Listar nombre y porcentaje de hablantes que tienen todos los idiomas declarados oficiales


-- Actualizar el valor de porcentaje del idioma ingles con el codigo 'AIA' a 100.0


-- Listar todas las ciudades que pertenecena Cordoba (district) dentro de Argentina


-- Eliminar todas las ciudades que pertenezcan a cordoba fuera de Argentina


-- Listar todos los paises cuyo jefe de estado se llame John


-- Listar todos los paises cuya poblacion este entre 35M y 35M ordenados por poblacion de forma descendente


-- Identificar las reduncancias del esquema final