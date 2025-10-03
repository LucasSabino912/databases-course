-- Lucas Nahuel Sabino
-- 44553764

-- 1
SELECT 
    c.*,
    SUM((od.`UnitPrice` * od.`Quantity`) - od.`Discount`) AS `TotalGastado`
FROM `customers` c
INNER JOIN `orders` o ON c.`CustomerID` = o.`CustomerID`
INNER JOIN `order details` od ON o.`OrderID` = od.`OrderID`
GROUP BY c.`CustomerID`
ORDER BY TotalGastado DESC
LIMIT 5;

-- 2
SELECT
    p.`ProductName` AS name, 
    SUM((od.`UnitPrice` * od.`Quantity`) - od.`Discount`) AS `VentasTotales`, 
    p.`CategoryID` AS `category`
FROM `products` p 
INNER JOIN `order details` od ON p.`ProductID` = od.`ProductID` 
GROUP BY `name`, `category` 
ORDER BY `category`, `VentasTotales` DESC; 

-- 3
SELECT 
    SUM((od.`UnitPrice` * od.`Quantity`) - od.`Discount`) AS `VentasTotales`, 
    p.`CategoryID` AS `category`
FROM `products` p 
INNER JOIN `order details` od ON p.`ProductID` = od.`ProductID` 
GROUP BY `category` 
ORDER BY `VentasTotales` DESC; 

-- 4
CREATE OR REPLACE VIEW employee_sales_per_year AS
SELECT 
    e.`EmployeeID`, 
    e.`LastName`, e.`FirstName` , 
    SUM(od.`Quantity` * od.`UnitPrice` - od.`Discount` ) AS `Ventas`, 
    YEAR(o.`OrderDate`) AS `Year`
FROM `employees` e 
INNER JOIN `orders` o ON e.`EmployeeID` = o.`EmployeeID`
INNER JOIN `order details` od  ON o.`OrderID` = od.`OrderID`
GROUP BY e.`EmployeeID`, `Year`
ORDER BY `Year`, `Ventas` ASC;

-- 5
DELIMITER $$

CREATE TRIGGER after_orderdetails_insert
AFTER INSERT ON `order details`
FOR EACH ROW
BEGIN
	DECLARE `product` INT;

	SELECT od.`ProductID` INTO `product`
	FROM `order details` od 
	WHERE od.`ProductID` = NEW.`ProductID`;

	UPDATE `products` SET `UnitsInStock` = `UnitsInStock` - NEW.`Quantity`;
END$$


DELIMITER ;

-- 6
CREATE ROLE 'Admin';
GRANT CREATE ON `northwind`.`customers` TO 'Admin';
GRANT UPDATE (`Phone`) ON `customers` TO `Admin`;