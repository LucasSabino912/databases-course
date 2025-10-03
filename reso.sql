use airbnb_like_db;

-- Listar las 7 propiedades con la mayor cantidad de reviews en el año 2024
/*
SELECT * FROM properties
WHERE properties.id IN
(select property_id
from reviews
where year(reviews.created_at) = 2024
group by property_id
order by count(*) desc
limit 7);
*/

select p.* 
from properties p 
inner join (
	select property_id as pid
	from reviews
	where year(reviews.created_at) = 2024
	group by pid
	order by count(*) desc
	limit 7) mostreviews on p.id = mostreviews.pid;

-- Obtener los ingresos por reservas de cada propiedad.
-- Esta consulta debe calcular los ingresos totales generados por cada propiedad.
-- Ayuda: hay un campo `price_per_night` en la tabla de `properties` donde los
-- ingresos totales se computan sumando la cantidad de noches reservadas para cada
-- reserva multiplicado por el precio por noche
-- `bookings`, relacionado con `properties`, tiene los campos de fecha `check_in` y `check_out`

SELECT 
    p.id,
    p.name,
    p.price_per_night,
    SUM(DATEDIFF(b.check_out, b.check_in) * p.price_per_night) AS total_ingresos
FROM properties p
INNER JOIN bookings b ON p.id = b.property_id
GROUP BY p.id, p.name, p.price_per_night
ORDER BY total_ingresos DESC;

-- Listar los principales usuarios según los pagos totales.
-- Esta consulta calcula los pagos totales realizados por cada usuario y enumera los
-- principales 10 usuarios según la suma de sus pagos.

select s.*, p.am as amount
from users s 
inner join (select user_id as uid, sum(amount) as am 
	from payments 
	group by uid 
	order by am desc 
	limit 10) p on p.uid = s.id;

-- Crear un trigger notify_host_after_booking que notifica al anfitrión sobre una nueva
-- reserva. Es decir, cuando se realiza una reserva, notifique al anfitrión de la propiedad
-- mediante un mensaje.
delimiter $$

create trigger notify_host_after_booking
after insert on bookings
for each row
begin
	declare anfitrion int;

	-- anfitrion de la propiedad reservada
	select owner_id into anfitrion
	from properties
	where id = new.property_id;
	
	-- enviar mensaje
	INSERT INTO messages (sender_id,receiver_id,property_id,content,sent_at) 
	VALUES(
		new.user_id, 
		anfitrion, 
		new.property_id, 
		CONCAT('Nueva reserva confirmada para tu propiedad'), 
		NOW()
		);
end$$

delimiter ;

/*
 * Crear un procedimiento add_new_booking para agregar una nueva reserva.
 * Este procedimiento agrega una nueva reserva para un usuario, según el ID de la
 * propiedad, el ID del usuario y las fechas de entrada y salida. Verifica si la propiedad
 * está disponible durante las fechas especificadas antes de insertar la reserva.
 */

DELIMITER $$

CREATE PROCEDURE add_new_booking(IN pid INT, IN uid INT, IN chin DATE, IN chout DATE, OUT bid INT)
BEGIN
    DECLARE booking_conflict INT DEFAULT 0;
    DECLARE property_exists INT DEFAULT 0;
    DECLARE user_exists INT DEFAULT 0;

    -- Validar que las fechas sean coherentes
    IF chin >= chout THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'La fecha de salida debe ser posterior a la fecha de entrada';
    END IF;

    -- Verificar que la propiedad existe
    SELECT COUNT(*) INTO property_exists
    FROM properties
    WHERE property_id = pid;

    IF property_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'La propiedad especificada no existe';
    END IF;

    -- Verificar que el usuario existe
    SELECT COUNT(*) INTO user_exists
    FROM users
    WHERE user_id = uid;

    IF user_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El usuario especificado no existe';
    END IF;

    -- Verificar disponibilidad
    SELECT COUNT(*) INTO booking_conflict
    FROM bookings
    WHERE property_id = pid
    AND status NOT IN ('cancelled', 'rejected')
    AND (
        (chin >= check_in_date AND chin < check_out_date) OR
        (chout > check_in_date AND chout <= check_out_date) OR
        (chin <= check_in_date AND chout >= check_out_date)
    );
    
    IF booking_conflict > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'La propiedad no está disponible en las fechas seleccionadas';
    END IF;
    
    -- Insertar la nueva reserva
    INSERT INTO bookings (property_id, user_id, check_in_date, check_out_date, status, booking_date)
    VALUES (pid, uid, chin, chout, 'pending', CURDATE());
    
    -- Devolver el ID de la reserva creada
    SET bid = LAST_INSERT_ID();    
END$$

DELIMITER ;