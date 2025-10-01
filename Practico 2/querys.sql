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
-- Primero veo como se define la independencia en la BD, tomo una muestra de 20
select Name, IndepYear
from country
limit 20;
-- Veo que se define como NULL =>
select Name
from country
where IndepYear is null ;

-- Listar nombre y porcentaje de hablantes que tienen todos los idiomas declarados oficiales
select Language, Percentage
from countrylanguage
where IsOfficial = 'T';

-- Actualizar el valor de porcentaje del idioma ingles con el codigo 'AIA' a 100.0
update countrylanguage
set percentage = 100.0
where CountryCode = 'AIA';


-- Listar todas las ciudades que pertenecena Cordoba (district) dentro de Argentina
select Name, District
from city
where District = 'Córdoba';
limit 1000;

-- Eliminar todas las ciudades que pertenezcan a cordoba fuera de Argentina
delete from city
where District != 'Córdoba' and CountryCode != 'ARG';

-- Listar todos los paises cuyo jefe de estado se llame John
select Name 
from country 
where HeadOfState LIKE '%John%';

-- Listar todos los paises cuya poblacion este entre 35M y 45M ordenados por poblacion de forma descendente
select Name, Population
from country
where Population between 35000000 and 45000000
order by Population desc;