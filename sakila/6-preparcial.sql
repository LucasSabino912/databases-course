use classicmodels;

-- Devuelve la oficina con mayor número de empleados
select
    o.officeCode,
    count(e.employeeNumber) as NumEmpleados
from employees e
inner join offices o on e.officeCode = o.officeCode
group by o.officeCode
order by NumEmpleados desc
limit 1;


-- ¿Cual es el promedio de ordenes hechas por oficina?, ¿Que oficina vendio la mayor cantidad de productos?
SELECT 
    off.officeCode,
    COUNT(o.orderNumber) AS total_orders,
    AVG(COUNT(o.orderNumber)) OVER() AS avg_orders_per_office
FROM customers c
INNER JOIN orders o ON o.customerNumber = c.customerNumber
INNER JOIN employees e ON c.salesRepEmployeeNumber = e.employeeNumber
INNER JOIN offices off ON e.officeCode = off.officeCode
GROUP BY off.officeCode;

SELECT 
    t.officeCode,
    t.total_orders,
    (SELECT AVG(total_orders) FROM (
         SELECT COUNT(o.orderNumber) AS total_orders
         FROM customers c
         JOIN orders o ON o.customerNumber = c.customerNumber
         JOIN employees e ON c.salesRepEmployeeNumber = e.employeeNumber
         JOIN offices off ON e.officeCode = off.officeCode
         GROUP BY off.officeCode
    ) x) AS avg_orders_per_office
FROM (
    SELECT off.officeCode, COUNT(o.orderNumber) AS total_orders
    FROM customers c
    JOIN orders o ON o.customerNumber = c.customerNumber
    JOIN employees e ON c.salesRepEmployeeNumber = e.employeeNumber
    JOIN offices off ON e.officeCode = off.officeCode
    GROUP BY off.officeCode
) t;


-- Cree una vista Premium Customers que devuelva el top 10 de clientes que más dinero han gastado en la plataforma. 
-- La vista deberá devolver el nombre del cliente, la ciudad y el total gastado por ese cliente en la plataforma.
create or replace view Premium_Customers as
select
	c.customerName as cliente,
	c.city,
	sum(p.amount) as total_gastado
from customers c
inner join payments p on c.customerNumber = p.customerNumber
group by c.customerNumber, c.customerName, c.city
order by total_gastado desc
limit 10;


-- Cree una función employee of the month que tome un mes y un año y devuelve el empleado (nombre y apellido) 
-- cuyos clientes hayan efectuado la mayor cantidad de órdenes en ese mes.
delimiter $$

create function employee_of_the_month(p_month int, p_year int)
returns varchar(100)
deterministic -- Siempre devolverá el mismo resultado para los mismos datos de entrada
begin
    -- Variable para guardar el nombre completo del empleado con más órdenes
    declare emp_name varchar(100);

    -- Consulta para obtener el nombre completo del empleado con más órdenes hechas en el mes y año indicados
    select concat(e.firstName, '', e.lastName)
    into emp_name
    from employees e
    inner join customers c on e.employeeNumber = c.salesRepEmployeeNumber
    inner join orders o on c.customerNumber = o.customerNumber
    where month(o.orderDate) = p_month and year(o.orderDate) = p_year
    group by e.employeeNumber -- corregido el nombre de la columna
    order by count(o.orderNumber) desc
    limit 1;

    -- Retorna el nombre del empleado encontrado
    return emp_name;
end$$

delimiter ;


-- Crear una nueva tabla Product Refillment. Deberá tener una relación varios a uno con products y los campos: 
-- `refillmentID`, `productCode`, `orderDate`, `quantity`.
create table product_refillment(
	refilmentID int primary key,
	productCode varchar(15),
	orderDate date,
	quantity int,
	foreign key (productCode) references products(productCode)
);


-- Definir un trigger Restock Product que esté pendiente de los cambios efectuados en orderdetails
-- y cada vez que se agregue una nueva orden revise la cantidad de productos pedidos quantityOrdered 
-- y compare con la cantidad en stock quantityInStock y si es menor a 10 genere un pedido en la tabla Product Refillment por 10 nuevos productos.
delimiter $$

create trigger restock_product
after insert on orderdetails
for each row
begin
	declare current_stock int;

	-- Obtener stock actual
	select quantityStock into current_stock
	from products
	where productCode = new.productCode;
	
	-- Si queda poco stock se hace el refill
	if current_stock < 10 then
		insert into Product_Refillment (productCode, orderDate, quantity)
		values (new.productCode, curdate(), 10);
	end if;
end$$

delimiter ;

-- Crear un rol Empleado en la BD que establezca accesos de lectura a todas las tablas y accesos de creación de vistas
create role 'Empleado';
grant select on classicmodels.* to 'Empleado';
grant create view on classicmodels.* to 'Empleado';


-- Encontrar, para cada cliente de aquellas ciudades que comienzan por 'N', la menor y la mayor diferencia en días 
-- entre las fechas de sus pagos. No mostrar el id del cliente, sino su nombre y el de su contacto.
SELECT 
    c.customerName,
    c.contactFirstName,
    MIN(DATEDIFF(p2.paymentDate, p1.paymentDate)) AS menor_diferencia,
    MAX(DATEDIFF(p2.paymentDate, p1.paymentDate)) AS mayor_diferencia
FROM customers c
JOIN payments p1 ON c.customerNumber = p1.customerNumber
JOIN payments p2 ON c.customerNumber = p2.customerNumber
WHERE c.city LIKE 'N%'
  AND p2.paymentDate > p1.paymentDate
GROUP BY c.customerName, c.contactFirstName;



-- Encontrar el nombre y la cantidad vendida total de los 10 productos más vendidos que, a su vez, 
-- representen al menos el 4% del total de productos, contando unidad por unidad, de todas las órdenes donde intervienen. No utilizar LIMIT.
WITH ventas AS (
    SELECT 
        od.productCode,
        SUM(od.quantityOrdered) AS total_vendido
    FROM orderdetails od
    GROUP BY od.productCode
),
total AS (
    SELECT SUM(total_vendido) AS total_general FROM ventas
),
productos_filtrados AS (
    SELECT 
        p.productName,
        v.total_vendido,
        (v.total_vendido / t.total_general) * 100 AS porcentaje
    FROM ventas v
    JOIN products p ON v.productCode = p.productCode
    CROSS JOIN total t
    WHERE (v.total_vendido / t.total_general) >= 0.04
)
SELECT productName, total_vendido
FROM productos_filtrados
ORDER BY total_vendido DESC
-- seleccionamos el top 10 comparando contra los 10 mayores (sin LIMIT)
HAVING total_vendido >= (
    SELECT MIN(total_vendido)
    FROM (
        SELECT total_vendido
        FROM productos_filtrados
        ORDER BY total_vendido DESC
        LIMIT 10
    ) AS sub
);



