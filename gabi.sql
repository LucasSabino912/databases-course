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

-- employees -> orders -> order details

CREATE OR REPLACE VIEW employee_yearly_most_sells AS
WITH YearlySales AS (
    SELECT
        e.EmployeeID,
        e.LastName,
        e.FirstName,
        SUM(od.Quantity * od.UnitPrice * (1 - od.Discount)) AS AnnualSales,
        YEAR(o.OrderDate) AS SaleYear
    FROM employees e
    JOIN orders o ON e.EmployeeID = o.EmployeeID
    JOIN `order details` od ON o.OrderID = od.OrderID
    GROUP BY e.EmployeeID, e.LastName, e.FirstName, SaleYear
),
RankedSales AS (
    SELECT
        EmployeeID,
        LastName,
        FirstName,
        AnnualSales,
        SaleYear,
        RANK() OVER (PARTITION BY SaleYear ORDER BY AnnualSales DESC) as SalesRank
    FROM YearlySales
)
SELECT
    EmployeeID,
    LastName,
    FirstName,
    AnnualSales,
    SaleYear
FROM RankedSales
WHERE SalesRank = 1
ORDER BY SaleYear ASC;

-- 5. Crear un trigger que se ejecute después de insertar un nuevo registro en la tabla
-- Order Details. Este trigger debe actualizar la tabla Products para disminuir la
-- cantidad en stock (UnitsInStock) del producto correspondiente, restando la
-- cantidad (Quantity) que se acaba de insertar en el detalle del pedido.

delimiter $$

CREATE TRIGGER new_order
AFTER INSERT ON `order details`
FOR EACH ROW
BEGIN
	DECLARE product INT;

	SELECT od.ProductID  INTO product
	FROM `order details` od 
	WHERE od.ProductID = new.ProductID;

	UPDATE products SET UnitsInStock = UnitsInStock - new.Quantity;
END$$

delimiter ;

-- 6. Crear un rol llamado admin y otorgarle los siguientes permisos:
--  crear registros en la tabla Customers.
--  actualizar solamente la columna Phone de Customers.

CREATE ROLE 'Admin';
GRANT CREATE ON northwind.customers TO 'Admin';
GRANT UPDATE (Phone) ON customers TO 'Admin';
