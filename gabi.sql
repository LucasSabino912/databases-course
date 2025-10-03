USE northwind;

-- 1 Listar los 5 clientes que más ingresos han generado a lo largo del tiempo.

-- customers -> orders -> order details

SELECT c.*, SUM(od.Quantity * od.UnitPrice - od.Discount ) AS income
FROM customers c 
INNER JOIN orders o ON c.CustomerID = o.CustomerID
INNER JOIN `order details` od  ON o.OrderID = od.OrderID
GROUP BY o.CustomerID
ORDER BY income DESC
LIMIT 5;

-- 2. Listar cada producto con sus ventas totales (dinero), agrupados por categoría.

SELECT p.ProductName AS name, SUM(od.Quantity * od.UnitPrice - od.Discount )  AS `ventas totales`, p.CategoryID AS category
FROM products p 
INNER JOIN `order details` od ON p.ProductID = od.ProductID 
GROUP BY name, category 
ORDER BY category, `ventas totales` desc; 

-- 3. Calcular el total de ventas para cada categoría (dinero).

SELECT SUM(od.Quantity * od.UnitPrice - od.Discount ) AS `ventas totales`, p.CategoryID AS category
FROM products p 
INNER JOIN `order details` od ON p.ProductID = od.ProductID 
GROUP BY category 
ORDER BY `ventas totales` desc; 

-- 4. Crear una vista que liste los empleados con más ventas por cada año, mostrando
-- empleado, año y total de ventas. Ordenar el resultado por año ascendente.

-- employees -> orders


-- 5. Crear un trigger que se ejecute después de insertar un nuevo registro en la tabla
-- Order Details. Este trigger debe actualizar la tabla Products para disminuir la
-- cantidad en stock (UnitsInStock) del producto correspondiente, restando la
-- cantidad (Quantity) que se acaba de insertar en el detalle del pedido.
--

-- 6. Crear un rol llamado admin y otorgarle los siguientes permisos:
--  crear registros en la tabla Customers.
--  actualizar solamente la columna Phone de Customers.