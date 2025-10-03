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




-- Cree una función employee of the month que tome un mes y un año y devuelve el empleado (nombre y apellido) 
-- cuyos clientes hayan efectuado la mayor cantidad de órdenes en ese mes.


-- Crear una nueva tabla Product Refillment. Deberá tener una relación varios a uno con products y los campos: 
-- `refillmentID`, `productCode`, `orderDate`, `quantity`.


-- Definir un trigger Restock Product que esté pendiente de los cambios efectuados en orderdetails
-- y cada vez que se agregue una nueva orden revise la cantidad de productos pedidos quantityOrdered 
-- y compare con la cantidad en stock quantityInStock y si es menor a 10 genere un pedido en la tabla Product Refillment por 10 nuevos productos.


-- Crear un rol Empleado en la BD que establezca accesos de lectura a todas las tablas y accesos de creación de vistas




-- Encontrar, para cada cliente de aquellas ciudades que comienzan por 'N', la menor y la mayor diferencia en días 
-- entre las fechas de sus pagos. No mostrar el id del cliente, sino su nombre y el de su contacto.



-- Encontrar el nombre y la cantidad vendida total de los 10 productos más vendidos que, a su vez, 
-- representen al menos el 4% del total de productos, contando unidad por unidad, de todas las órdenes donde intervienen. No utilizar LIMIT.



