create database world;

use world;

create table country(
	Code varchar(255) primary key,
	Name varchar(255),
	Continent varchar(255),
	Region varchar(255),
	SurfaceArea int,
	IndepYear int,
	Population int,
	LifeExpectancy int,
	GNP int,
	GNPOld int,
	LocalName varchar(255),
	GovernmentForm varchar(255),
	HeadOfState varchar(255),
	Capital int,
	Code2 varchar(255)
);

create table city(
	ID int primary key,
	Name varchar(255),
	CountryCode varchar(255),
	District varchar(255),
	Population int,
	foreign key (CountryCode) references country(Code)
);

create table countrylanguage(
	CountryCode varchar(255),
	Language varchar(255),
	IsOfficial varchar(255),
	percentage decimal(4, 2),
	primary key(CountryCode, Language),
	foreign key (CountryCode) references country(Code)
);


CREATE TABLE continent (
    Name VARCHAR(255) PRIMARY KEY,
    Area INT,
    MasaTerrestre varchar(10),
    MostPopulousCity VARCHAR(255) UNIQUE
);


INSERT INTO continent (Name, Area, MasaTerrestre, MostPopulousCity) VALUES
('Africa', 30370000, '20.4%', 'Cairo, Egypt'),
('Antarctica', 14000000, '9.2%', 'McMurdo Station*'),
('Asia', 44579000, '29.5%', 'Mumbai, India'),
('Europe', 10180000, '6.8%', 'Istanbul, Turkey'),
('North America', 24709000, '16.5%', 'Mexico City, Mexico'),
('Oceania', 8600000, '5.9%', 'Sydney, Australia'),
('South America', 17840000, '12.0%', 'São Paulo, Brazil');

-- modificar la tabla country de manera de que el campo Continent pase a ser una fk a la tabla continent
-- me aseguro que tenga el mismo tipo
alter table country
modify Continent varchar(255);

alter table country
add constraint fk_country_continent
foreign key (Continent) references Continent(Name);


