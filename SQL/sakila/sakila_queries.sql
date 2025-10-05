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
    select concat(e.firstName, ' ', e.lastName)
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

-- TRIGGERS
DELIMITER $$
CREATE TRIGGER after_customer_insert
AFTER INSERT ON customers
FOR EACH ROW
BEGIN
    INSERT INTO audit (table_name, action, row_id)
    VALUES ('customers', 'insert', NEW.customerNumber);
END$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER before_payment_delete
BEFORE DELETE ON payments
FOR EACH ROW
BEGIN
    INSERT INTO archived_payments (customerNumber, checkNumber, paymentDate, amount)
    VALUES (OLD.customerNumber, OLD.checkNumber, OLD.paymentDate, OLD.amount);
END$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER after_order_update
AFTER UPDATE ON orders
FOR EACH ROW
BEGIN
    IF OLD.status <> NEW.status THEN
        INSERT INTO order_status_log (orderNumber, old_status, new_status, change_timestamp)
        VALUES (NEW.orderNumber, OLD.status, NEW.status, NOW());
    END IF;
END$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER before_product_update
BEFORE UPDATE ON products
FOR EACH ROW
BEGIN
    IF NEW.buyPrice <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Buy price must be positive.';
    END IF;
END$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER after_employee_delete
AFTER DELETE ON employees
FOR EACH ROW
BEGIN
    UPDATE customers SET salesRepEmployeeNumber = NULL WHERE salesRepEmployeeNumber = OLD.employeeNumber;
END$$
DELIMITER ;

-- FUNCTIONS
DELIMITER $$
CREATE FUNCTION get_customer_balance(p_customerNumber INT)
RETURNS DECIMAL(10, 2)
DETERMINISTIC
BEGIN
    DECLARE balance DECIMAL(10, 2);
    SELECT SUM(amount) INTO balance FROM payments WHERE customerNumber = p_customerNumber;
    RETURN balance;
END$$
DELIMITER ;

DELIMITER $$
CREATE FUNCTION count_products_in_category(p_productLine VARCHAR(50))
RETURNS INT
DETERMINISTIC
BEGIN
    DECLARE product_count INT;
    SELECT COUNT(*) INTO product_count FROM products WHERE productLine = p_productLine;
    RETURN product_count;
END$$
DELIMITER ;

DELIMITER $$
CREATE FUNCTION get_total_sales_by_year(p_year INT)
RETURNS DECIMAL(10, 2)
DETERMINISTIC
BEGIN
    DECLARE total_sales DECIMAL(10, 2);
    SELECT SUM(od.quantityOrdered * od.priceEach) INTO total_sales
    FROM orders o
    JOIN orderdetails od ON o.orderNumber = od.orderNumber
    WHERE YEAR(o.orderDate) = p_year;
    RETURN total_sales;
END$$
DELIMITER ;

DELIMITER $$
CREATE FUNCTION is_product_available(p_productCode VARCHAR(15))
RETURNS BOOLEAN
DETERMINISTIC
BEGIN
    DECLARE stock INT;
    SELECT quantityInStock INTO stock FROM products WHERE productCode = p_productCode;
    RETURN stock > 0;
END$$
DELIMITER ;

DELIMITER $$
CREATE FUNCTION get_employee_sales_count(p_employeeNumber INT)
RETURNS INT
DETERMINISTIC
BEGIN
    DECLARE sales_count INT;
    SELECT COUNT(DISTINCT o.orderNumber) INTO sales_count
    FROM employees e
    JOIN customers c ON e.employeeNumber = c.salesRepEmployeeNumber
    JOIN orders o ON c.customerNumber = o.customerNumber
    WHERE e.employeeNumber = p_employeeNumber;
    RETURN sales_count;
END$$
DELIMITER ;

-- PROCEDURES
DELIMITER $$
CREATE PROCEDURE add_new_customer(
    IN p_customerName VARCHAR(50),
    IN p_contactLastName VARCHAR(50),
    IN p_contactFirstName VARCHAR(50),
    IN p_phone VARCHAR(50),
    IN p_addressLine1 VARCHAR(50),
    IN p_city VARCHAR(50),
    IN p_country VARCHAR(50)
)
BEGIN
    INSERT INTO customers (customerName, contactLastName, contactFirstName, phone, addressLine1, city, country)
    VALUES (p_customerName, p_contactLastName, p_contactFirstName, p_phone, p_addressLine1, p_city, p_country);
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE update_product_stock(
    IN p_productCode VARCHAR(15),
    IN p_quantity INT
)
BEGIN
    UPDATE products SET quantityInStock = quantityInStock + p_quantity WHERE productCode = p_productCode;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE get_orders_by_customer(IN p_customerNumber INT)
BEGIN
    SELECT * FROM orders WHERE customerNumber = p_customerNumber;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE assign_employee_to_office(
    IN p_employeeNumber INT,
    IN p_officeCode VARCHAR(10)
)
BEGIN
    UPDATE employees SET officeCode = p_officeCode WHERE employeeNumber = p_employeeNumber;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE create_payment(
    IN p_customerNumber INT,
    IN p_checkNumber VARCHAR(50),
    IN p_amount DECIMAL(10, 2)
)
BEGIN
    INSERT INTO payments (customerNumber, checkNumber, paymentDate, amount)
    VALUES (p_customerNumber, p_checkNumber, CURDATE(), p_amount);
END$$
DELIMITER ;

-- VIEWS
CREATE OR REPLACE VIEW customer_order_summary AS
SELECT
    c.customerName,
    COUNT(o.orderNumber) AS total_orders,
    SUM(p.amount) AS total_spent
FROM customers c
LEFT JOIN orders o ON c.customerNumber = o.customerNumber
LEFT JOIN payments p ON c.customerNumber = p.customerNumber
GROUP BY c.customerName;

CREATE OR REPLACE VIEW product_inventory AS
SELECT
    p.productName,
    p.quantityInStock,
    p.buyPrice
FROM products p;

CREATE OR REPLACE VIEW employee_sales_performance AS
SELECT
    e.firstName,
    e.lastName,
    COUNT(DISTINCT o.orderNumber) AS total_orders,
    SUM(od.quantityOrdered * od.priceEach) AS total_sales
FROM employees e
LEFT JOIN customers c ON e.employeeNumber = c.salesRepEmployeeNumber
LEFT JOIN orders o ON c.customerNumber = o.customerNumber
LEFT JOIN orderdetails od ON o.orderNumber = od.orderNumber
GROUP BY e.employeeNumber;

CREATE OR REPLACE VIEW office_sales_summary AS
SELECT
    off.city,
    COUNT(DISTINCT o.orderNumber) AS total_orders,
    SUM(od.quantityOrdered * od.priceEach) AS total_sales
FROM offices off
LEFT JOIN employees e ON off.officeCode = e.officeCode
LEFT JOIN customers c ON e.employeeNumber = c.salesRepEmployeeNumber
LEFT JOIN orders o ON c.customerNumber = o.customerNumber
LEFT JOIN orderdetails od ON o.orderNumber = od.orderNumber
GROUP BY off.officeCode;

CREATE OR REPLACE VIEW top_10_products AS
SELECT
    p.productName,
    SUM(od.quantityOrdered) AS total_quantity_sold
FROM products p
JOIN orderdetails od ON p.productCode = od.productCode
GROUP BY p.productCode
ORDER BY total_quantity_sold DESC
LIMIT 10;
