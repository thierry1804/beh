-- ========================================
-- REQUÊTES DE VÉRIFICATION POUR LES VENTES ORDINAIRES
-- ========================================

-- 1. Vérifier toutes les commandes récentes avec leurs sessions
SELECT 
  o.id,
  o.order_number,
  o.order_status,
  o.total_amount,
  o.created_at,
  s.name as session_name,
  s.session_type,
  c.tiktok_name,
  c.real_name
FROM orders o
JOIN sessions s ON o.session_id = s.id
JOIN customers c ON o.customer_id = c.id
ORDER BY o.created_at DESC
LIMIT 20;

-- 2. Vérifier spécifiquement les commandes de ventes ordinaires
SELECT 
  o.id,
  o.order_number,
  o.order_status,
  o.total_amount,
  o.created_at,
  s.name as session_name,
  s.session_type,
  c.tiktok_name,
  c.real_name,
  cp.phone
FROM orders o
JOIN sessions s ON o.session_id = s.id AND s.session_type = 'VENTE_ORDINAIRE'
JOIN customers c ON o.customer_id = c.id
LEFT JOIN customer_phones cp ON c.id = cp.customer_id AND cp.is_primary = true
ORDER BY o.created_at DESC;

-- 3. Vérifier les lignes de commande pour les ventes ordinaires
SELECT 
  ol.id,
  ol.code,
  ol.description,
  ol.unit_price,
  ol.quantity,
  ol.line_total,
  ol.created_at,
  o.order_number,
  o.order_status,
  c.real_name,
  s.session_type
FROM order_lines ol
JOIN orders o ON ol.order_id = o.id
JOIN customers c ON o.customer_id = c.id
JOIN sessions s ON o.session_id = s.id
WHERE s.session_type = 'VENTE_ORDINAIRE'
ORDER BY ol.created_at DESC;

-- 4. Vérifier les commandes en attente (ce que voit la page Pending)
SELECT 
  ol.id as line_id,
  ol.code,
  ol.description,
  ol.unit_price,
  ol.quantity,
  ol.line_total,
  o.id as order_id,
  o.order_status,
  c.tiktok_name,
  c.real_name,
  s.name as session_name
FROM order_lines ol
JOIN orders o ON ol.order_id = o.id
JOIN customers c ON o.customer_id = c.id
JOIN sessions s ON o.session_id = s.id
WHERE o.order_status IN ('CHECKOUT EN COURS', 'CREEE')
ORDER BY ol.created_at DESC;

-- 5. Vérifier les clients créés récemment pour les ventes ordinaires
SELECT 
  c.id,
  c.tiktok_name,
  c.real_name,
  c.created_at,
  cp.phone,
  ca.address
FROM customers c
LEFT JOIN customer_phones cp ON c.id = cp.customer_id AND cp.is_primary = true
LEFT JOIN customer_addresses ca ON c.id = ca.customer_id AND ca.is_primary = true
WHERE c.real_name IS NOT NULL
  AND c.tiktok_name LIKE '@%_%'  -- Format généré automatiquement
ORDER BY c.created_at DESC
LIMIT 10;

-- 6. Compter les commandes par type de session
SELECT 
  s.session_type,
  COUNT(o.id) as nombre_commandes,
  COUNT(DISTINCT c.id) as nombre_clients,
  SUM(o.total_amount) as montant_total
FROM sessions s
LEFT JOIN orders o ON s.id = o.session_id
LEFT JOIN customers c ON o.customer_id = c.id
GROUP BY s.session_type;

-- 7. Diagnostiquer les commandes sans lignes (problème potentiel)
SELECT 
  o.id,
  o.order_number,
  o.order_status,
  o.created_at,
  c.real_name,
  s.session_type,
  COUNT(ol.id) as nombre_lignes
FROM orders o
JOIN customers c ON o.customer_id = c.id
JOIN sessions s ON o.session_id = s.id
LEFT JOIN order_lines ol ON o.id = ol.order_id
GROUP BY o.id, o.order_number, o.order_status, o.created_at, c.real_name, s.session_type
HAVING COUNT(ol.id) = 0
ORDER BY o.created_at DESC;
