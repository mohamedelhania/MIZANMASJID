-- Ejecuta este script en el editor SQL de Supabase para añadir el seguimiento del mes/año real de pago

ALTER TABLE shart_payments ADD COLUMN payment_year integer;
ALTER TABLE shart_payments ADD COLUMN payment_month integer;

-- Para pagos pasados de shart, asumimos que se pagaron en el mes que les corresponde
UPDATE shart_payments
SET 
  payment_year = (SELECT year FROM shart_contributors WHERE id = shart_payments.contributor_id),
  payment_month = month
WHERE paid = true;

ALTER TABLE student_payments ADD COLUMN payment_year integer;
ALTER TABLE student_payments ADD COLUMN payment_month integer;

-- Para pagos pasados de alumnos, asumimos que se pagaron en el mes que les corresponde
UPDATE student_payments
SET 
  payment_year = year,
  payment_month = month
WHERE paid = true;
