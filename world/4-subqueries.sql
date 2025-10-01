use world;

-- Listar el nombre de la ciudad y el nombre del pais de todas las ciudades que pertenezcan a paises con una poblacion menor a 10mil habitantes
select 
	ci.Name as CityName,
	co.Name as CountryName
from city ci
inner join country co on ci.CountryCode = co.Code
where co.Code in (
	select Code
	from country
	where Population < 10000
);

-- Listar todas aquellas ciudades cuya población sea mayor que la población promedio entre todas las ciudades.
select Name, Population
from city
where population > (
	select avg(Population)
	from city
);


-- Listar todas aquellas ciudades no asiáticas cuya población sea igual o mayor a la población total de algún país de Asia.
select Name
from city
where Population >= any (
	select Population
	from country
	where Continent = 'Asia'
);

-- Listar aquellos países junto a sus idiomas no oficiales, que superen en porcentaje de hablantes a cada uno de los idiomas oficiales del país.
select
	co.Name,
	cl.Language
from country co
inner join countrylanguage cl on co.Code = cl.CountryCode
where cl.IsOfficial = 'F' and cl.percentage > all (
	select cl2.Percentage
	from countrylanguage cl2
	where cl2.CountryCode = co.Code
	and cl.isofficial = 'T'
);

-- Listar (sin duplicados) aquellas regiones que tengan países con una superficie menor a 1000 km2 y exista (en el país) al menos una ciudad con más de 100000 habitantes. (Hint: Esto puede resolverse con o sin una subquery, intenten encontrar ambas respuestas).
select distinct
	co.region,
	ci.Population
from country co
inner join city ci on co.Code = ci.CountryCode
where co.SurfaceArea > 1000 and ci.Population > 100000;

select distinct co.Region
from country co
where co.SurfaceArea < 1000 and exists (
	select 1
	from city ci
	where ci.CountryCode = co.Code and ci.Population > 100000
  );


-- Listar el nombre de cada país con la cantidad de habitantes de su ciudad más poblada. (Hint: Hay dos maneras de llegar al mismo resultado. Usando consultas escalares o usando agrupaciones, encontrar ambas).


-- Listar aquellos países y sus lenguajes no oficiales cuyo porcentaje de hablantes sea mayor al promedio de hablantes de los lenguajes oficiales.


-- Listar la cantidad de habitantes por continente ordenado en forma descendente.


-- Listar el promedio de esperanza de vida (LifeExpectancy) por continente con una esperanza de vida entre 40 y 70 años.


-- Listar la cantidad máxima, mínima, promedio y suma de habitantes por continente.
