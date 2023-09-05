SELECT 'redirect' AS component,
        'signin.sql?error' AS link
WHERE logged_in_user(sqlpage.cookie('session')) IS NULL;

SELECT 'shell' AS component, 'Protected page' AS title, 'lock' AS icon, '/' AS link, 'logout' AS menu_item;

SELECT 'text' AS component,
        'Welcome, ' || logged_in_user(sqlpage.cookie('session')) || ' !' AS title,
        'This content is [top secret](https://youtu.be/dQw4w9WgXcQ).
        You cannot view it if you are not connected.' AS contents_md;

SELECT
  'form' AS component,
  'Date' AS title,
  'GET' AS method;
SELECT
   'Date' AS name,
   'date' AS type,
   COALESCE(CAST($Date AS DATE), date('now')) AS value,

   TRUE as required;


SELECT 
    'table' as component;
SELECT clientname as title,
       store_name as Description,
       startdate,
       enddate,
       statuss    
FROM stateless_lib_support_and_notifications.daily_sqlpage 
 where   startdate = CAST($Date AS DATE) ;



--  SELECT 
--     'table' as component;
-- SELECT clientname as title,
--        store_name as Description,
--        startdate,
--        enddate,
--        statuss    
-- FROM stateless_lib_support_and_notifications.daily_sqlpage 
--  where   startdate BETWEEN CAST($Date AS DATE) AND (CAST($Date AS DATE) + INTERVAL '1 day');





