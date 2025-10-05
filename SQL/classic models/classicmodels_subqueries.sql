use sakila;

-- Cree una tabla de `directors` con las columnas: Nombre, Apellido, Número de Películas.
create table director (
	Nombre varchar(255),
	Apellido varchar(255),
	NumeroPeliculas int,
	primary key(nombre, apellido)
);


-- El top 5 de actrices y actores de la tabla `actors` que tienen la mayor experiencia son también directores de las películas en las que participaron. 
-- Basados en esta información, inserten, utilizando una subquery los valores correspondientes en la tabla `directors`.
insert into director (Nombre, Apellido, NumeroPeliculas)
select
	a.first_name,
	a.last_name,
	count(fa.film_id) as num_pelis
from actor a
inner join film_actor fa on a.actor_id = fa.actor_id
group by a.actor_id
order by count(fa.film_id) desc
limit 5;


-- Agregue una columna `premium_customer` que tendrá un valor 'F' o 'T'; de acuerdo a si el cliente es premium o no. Por defecto ningún cliente será premium.
alter table customer
add column premium_customer char(1) default 'F';


-- Modifique la tabla customer. Marque con 'T' en la columna `premium_customer` de los 10 clientes con mayor dinero gastado en la plataforma.
update customer c
inner join (
	select customer_id
	from payment
	group by customer_id
	order by sum(amount) desc
	limit 10
) top10
on c.customer_id = top10.customer_id
set c.premium_customer = 'T;'


-- Listar, ordenados por cantidad de películas (de mayor a menor), los distintos ratings de las películas existentes
select rating, count(*) as cantidad_peliculas
from film
group by rating
order by cantidad_peliculas desc;


-- ¿Cuáles fueron la primera y última fecha donde hubo pagos?
select
	min(payment_date) as primer_pago,
	max(payment_date) as ultimo_pago
from payment;


-- Calcule, por cada mes, el promedio de pagos (Hint: vea la manera de extraer el nombre del mes de una fecha).
select
	monthname(payment_date) as Mes,
	avg(amount) as PromedioPagos
from payment
group by Mes;


-- Listar los 10 distritos que tuvieron mayor cantidad de alquileres (con la cantidad total de alquileres).
select 
	a.district,
	count(*) as total_alquileres
from rental r
inner join inventory i on r.inventory_id = i.inventory_id
inner join store s on i.store_id = s.store_id
inner join address a on s.address_id = a.address_id
group by a.district
order by total_alquileres desc
limit 10;


-- Modificar la table inventory agregando una columna stock que sea un número entero y 
-- representa la cantidad de copias de una misma película que tiene determinada tienda. El número por defecto debería ser 5 copias.
alter table inventory
add column stock int default 5;

-- Cree un trigger `update_stock` que, cada vez que se agregue un nuevo registro a la tabla rental, 
-- haga un update en la tabla `inventory` restando una copia al stock de la película rentada 
-- (Hint: revisar que el rental no tiene información directa sobre la tienda, sino sobre el cliente, que está asociado a una tienda en particular).
delimiter $$

create trigger update_stock
after insert on rental
for each row
begin 
	-- Actualiza el stock de la pelicula rentada
	update inventory
	set stock = stock - 1
	where inventory_id = new.inventory_id;
end$$

delimiter ;


-- Cree una tabla `fines` que tenga dos campos: `rental_id` y `amount`. El primero es una clave foránea a la tabla rental y el segundo es un valor numérico con dos decimales.
create table fines (
	rental_id int primary key,
	amount decimal(5,2),
	foreign key (rental_id) references rental(rental_id)
);

-- Cree un procedimiento `check_date_and_fine` que revise la tabla `rental` y cree un registro en la tabla `fines` por cada `rental` cuya devolución (return_date) haya
-- tardado más de 3 días (comparación con rental_date). El valor de la multa será el número de días de retraso multiplicado por 1.5.
delimiter $$ 

create procedure check_date_and_fine()
begin
	insert into fines (rental_id, amount)
	select 
		rental_id,
		datediff(return_date, rental_date) * 1.5 as amount
	from rental
	where return_date is not null
	and datediff(return_date, rental_date) > 3;
end$$ 

delimiter ;

-- Crear un rol `employee` que tenga acceso de inserción, eliminación y actualización a la tabla `rental`.
-- Creo el rol
create role 'employee';

-- Le asigno privilegios a la tabla rental
grant insert, update, delete on sakila.rental to 'employee';

-- Para que el rol pueda ser usado por un usuario hay que asignarlo
-- grant 'employee' to 'Lucas'
-- set default role 'employee' to 'Lucas' 


-- Revocar el acceso de eliminación a `employee` y crear un rol `administrator` que tenga todos los privilegios sobre la BD `sakila`.

-- Revoco el permiso delete sobre la tabla rental
revoke delete on sakila.rental from 'employee';

-- Creo rol administrator
create role 'administrator';

-- Asigno todos los privilegios sobre la base de datos sakila
grant all privileges on sakila.* to 'administrator';



-- Crear dos roles de empleado. A uno asignarle los permisos de `employee` y al otro de `administrator`.

-- Creo dos usuarios empleado
create user 'empleado1'@'localhost' identified by 'password1';
create user 'empleado2'@'localhost' identified by 'password2';

-- Asigno roles a los usuarios
grant 'employee' to 'empleado1'@'localhost';
grant 'administrator' to 'empleado2'@'localhost';

-- Activar el rol por defecto para cada usuario
set default role 'employee' to 'empleado1'@'localhost';
set default role 'administrator' to 'empleado2'@'localhost';