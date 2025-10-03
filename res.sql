-- Listar los 5 clientes que más ingresos han generado a lo largo del tiempo.
SELECT 
    c.*,
    SUM((od.`UnitPrice` * od.`Quantity`) - od.`Discount`) AS `TotalGastado`
FROM `customers` c
INNER JOIN `orders` o ON c.`CustomerID` = o.`CustomerID`
INNER JOIN `order details` od ON o.`OrderID` = od.`OrderID`
GROUP BY c.`CustomerID`
ORDER BY TotalGastado DESC
LIMIT 5;

-- Listar cada producto con sus ventas totales, agrupados por categoría.
SELECT
    p.`ProductName` AS name, 
    SUM((od.`UnitPrice` * od.`Quantity`) - od.`Discount`) AS `VentasTotales`, 
    p.`CategoryID` AS `category`
FROM `products` p 
INNER JOIN `order details` od ON p.`ProductID` = od.`ProductID` 
GROUP BY `name`, `category` 
ORDER BY `category`, `VentasTotales` DESC; 

-- Calcular el total de ventas para cada categoría (dinero).

SELECT 
    SUM((od.`UnitPrice` * od.`Quantity`) - od.`Discount`) AS `VentasTotales`, 
    p.`CategoryID` AS `category`
FROM `products` p 
INNER JOIN `order details` od ON p.`ProductID` = od.`ProductID` 
GROUP BY `category` 
ORDER BY `VentasTotales` DESC; 

-- Crear una vista que liste los empleados con más ventas por cada año, mostrando
-- empleado, año y total de ventas. Ordenar el resultado por año ascendente.





-- Crear un trigger que se ejecute después de insertar un nuevo registro en la tabla
-- Order Details. Este trigger debe actualizar la tabla Products para disminuir la
-- cantidad en stock (UnitsInStock) del producto correspondiente, restando la
-- cantidad (Quantity) que se acaba de insertar en el detalle del pedido.






-- Crear un rol llamado admin y otorgarle los siguientes permisos:
-- ● crear registros en la tabla Customers.
-- ● actualizar solamente la columna Phone de Customers.

CREATE ROLE 'Admin';
GRANT CREATE ON `northwind`.`customers` TO 'Admin';

-- actualizar solamente la columna Phone de Customers.
GRANT UPDATE ON `nortwind`.`customers`.`Phone`;