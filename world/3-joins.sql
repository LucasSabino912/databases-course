use world;

-- Lista el nombre de la ciudad, nombre del pais, region y forma de gobierno de las 10 ciudades mas pobladas del mundo
select
	ci.Name as CityName,
	co.Name as CountryName,
	co.Region,
	co.GovernmentForm
from city as ci
inner join country co on ci.CountryCode = co.Code -- especifico la union usando la fk que une a las dos tablas
order by ci.Population desc
limit 10;


-- Listar los 10 paises con menor poblacion del mundo, junto a sus ciudades capitales. Si no tienen capital debera mostrar 'NULL'
select 
	ci.Name as CityName,
	co.Name as CountryName,
	co.Population
from country co	
left join city ci on co.Capital = ci.ID
order by Population asc
limit 10;


-- Listar el nombre, continente y todos los lenguajes oficiales de cada pais
	select 
		co.Name as CountryName,
		co.Continent,
		cl.Language as CountryLanguage
	from country co
	inner join countrylanguage cl on co.Code = cl.CountryCode
	where cl.IsOfficial = 'T';

-- Listar el nombre del pais y nombre de la capital, de los 20 paises con mayor superficie del mundo
-- Version paises sin capital
select
	co.Name as CountryName,
	ci.Name as CityName,
	co.SurfaceArea
from country co
left join city ci on co.Capital = ci.ID
order by SurfaceArea desc
limit 20;

-- Version paises con capital
select
	co.Name as CountryName,
	ci.Name as CityName,
	co.SurfaceArea
from country co
inner join city ci on co.Capital = ci.ID
order by SurfaceArea desc
limit 20

-- Listar las ciudades junto a sus idiomas oficiales (ordenado por la poblacion de la ciudad) y el porcentaje de hablantes de ese idioma
select
	ci.Name as CityName,
	cl.Percentage,
	cl.Language
from city ci
inner join countrylanguage cl on ci.CountryCode = cl.CountryCode
where cl.IsOfficial = 'T'
order by ci.Population desc;

-- Listar los 10 paises con mayor poblacion y los 10 con menor poblacion (que tengan al menos 100 habitantes) en la misma consulta
(select Name, Population
from country
order by Population desc
limit 10)
union all
(select Name, Population
from country
where Population >= 100
order by Population asc
limit 10);

-- Listar aquellos paises que tengan hablantes del ingles per no del español en su poblacion
select co.Name
from country co
where exists (
	select cl.Language 
	from countrylanguage cl
	where cl.CountryCode = co.Code and cl.language = 'English'
)
and not exists (
	select cl.Language 
	from countrylanguage cl
	where cl.CountryCode = co.Code and cl.language = 'Spanish'
);


	
