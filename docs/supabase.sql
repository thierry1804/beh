-- ========================================
-- NOUVELLE STRUCTURE DE BASE DE DONNÉES OPTIMISÉE
-- ========================================

-- Sessions de vente
CREATE TABLE IF NOT EXISTS public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  session_type text NOT NULL DEFAULT 'LIVE_TIKTOK' CHECK (session_type IN ('LIVE_TIKTOK', 'VENTE_ORDINAIRE')),
  start_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'open',
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Garantir au plus une session ouverte (status = 'open')
CREATE UNIQUE INDEX IF NOT EXISTS uniq_open_session ON public.sessions ((status)) WHERE status = 'open';

-- Clients (informations de base uniquement)
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tiktok_name text UNIQUE NOT NULL,
  real_name text,
  photo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Téléphones multiples par client
CREATE TABLE IF NOT EXISTS public.customer_phones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  phone text NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(customer_id, phone)
);

-- Adresses multiples par client
CREATE TABLE IF NOT EXISTS public.customer_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  address text NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Commandes (informations principales)
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  customer_phone_id uuid REFERENCES public.customer_phones(id),
  customer_address_id uuid REFERENCES public.customer_addresses(id),
  order_number text NOT NULL,
  order_date timestamptz NOT NULL DEFAULT now(),
  delivery_date date,
  delivery_mode text CHECK (delivery_mode IN ('RECUPERATION', 'VIA SERVICE DE LIVRAISON')),
  payment_method text,
  payment_reference text,
  deposit_amount numeric(12,2) NOT NULL DEFAULT 0,
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  is_province boolean NOT NULL DEFAULT false,
  transport text,
  order_status text NOT NULL DEFAULT 'CREEE' CHECK (order_status IN ('CREEE', 'CHECKOUT EN COURS', 'CONFIRMEE', 'EN PREPARATION', 'LIVREE', 'ANNULEE')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Lignes de commande (détails des produits)
CREATE TABLE IF NOT EXISTS public.order_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  code text NOT NULL DEFAULT 'JP',
  description text NOT NULL,
  unit_price numeric(12,2) NOT NULL DEFAULT 0,
  quantity integer NOT NULL DEFAULT 1,
  line_total numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_customer_phones_customer ON public.customer_phones(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer ON public.customer_addresses(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_session_customer ON public.orders(session_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_lines_order ON public.order_lines(order_id);
CREATE INDEX IF NOT EXISTS idx_order_lines_status ON public.order_lines(status);

-- Contraintes pour garantir qu'un client n'a qu'un seul téléphone/adresse principal
CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_phones_primary ON public.customer_phones(customer_id) WHERE is_primary = true;
CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_addresses_primary ON public.customer_addresses(customer_id) WHERE is_primary = true;

-- Profils utilisateurs avec rôles (admin / operator)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'operator' CHECK (role IN ('admin','operator')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

-- Activer RLS sur toutes les tables
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_phones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Politiques pour les sessions
CREATE POLICY "Authenticated read sessions" ON public.sessions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated write sessions" ON public.sessions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated update sessions" ON public.sessions FOR UPDATE USING (auth.role() = 'authenticated');

-- Politiques pour les clients
CREATE POLICY "Authenticated read customers" ON public.customers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated write customers" ON public.customers FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated update customers" ON public.customers FOR UPDATE USING (auth.role() = 'authenticated');

-- Politiques pour les téléphones clients
CREATE POLICY "Authenticated read customer_phones" ON public.customer_phones FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated write customer_phones" ON public.customer_phones FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated update customer_phones" ON public.customer_phones FOR UPDATE USING (auth.role() = 'authenticated');

-- Politiques pour les adresses clients
CREATE POLICY "Authenticated read customer_addresses" ON public.customer_addresses FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated write customer_addresses" ON public.customer_addresses FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated update customer_addresses" ON public.customer_addresses FOR UPDATE USING (auth.role() = 'authenticated');

-- Politiques pour les commandes
CREATE POLICY "Authenticated read orders" ON public.orders FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated write orders" ON public.orders FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated update orders" ON public.orders FOR UPDATE USING (auth.role() = 'authenticated');

-- Politiques pour les lignes de commande
CREATE POLICY "Authenticated read order_lines" ON public.order_lines FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated write order_lines" ON public.order_lines FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated update order_lines" ON public.order_lines FOR UPDATE USING (auth.role() = 'authenticated');

-- Politiques pour les profils
CREATE POLICY "Read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Politique: un admin peut lire/mettre à jour tous les profils
CREATE POLICY "Admin read all profiles" ON public.profiles FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
CREATE POLICY "Admin update all profiles" ON public.profiles FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- ========================================
-- TRIGGERS ET FONCTIONS
-- ========================================

-- Trigger: créer automatiquement un profil lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles(id) VALUES (new.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fonction pour calculer automatiquement le total d'une commande
CREATE OR REPLACE FUNCTION public.calculate_order_total()
RETURNS trigger AS $$
BEGIN
  UPDATE public.orders 
  SET total_amount = (
    SELECT COALESCE(SUM(line_total), 0)
    FROM public.order_lines 
    WHERE order_id = NEW.order_id
  )
  WHERE id = NEW.order_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour mettre à jour le total de la commande quand une ligne change
DROP TRIGGER IF EXISTS update_order_total ON public.order_lines;
CREATE TRIGGER update_order_total
  AFTER INSERT OR UPDATE OR DELETE ON public.order_lines
  FOR EACH ROW EXECUTE FUNCTION public.calculate_order_total();

-- ========================================
-- FONCTIONS UTILITAIRES
-- ========================================

-- Fonction pour obtenir ou créer un client
CREATE OR REPLACE FUNCTION public.get_or_create_customer(tiktok_name_param text, real_name_param text DEFAULT NULL)
RETURNS uuid AS $$
DECLARE
  customer_id uuid;
BEGIN
  -- Essayer de trouver le client existant
  SELECT id INTO customer_id 
  FROM public.customers 
  WHERE tiktok_name = tiktok_name_param;
  
  -- Si le client n'existe pas, le créer
  IF customer_id IS NULL THEN
    INSERT INTO public.customers (tiktok_name, real_name)
    VALUES (tiktok_name_param, real_name_param)
    RETURNING id INTO customer_id;
  END IF;
  
  RETURN customer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir ou créer un téléphone
CREATE OR REPLACE FUNCTION public.get_or_create_customer_phone(customer_id_param uuid, phone_param text)
RETURNS uuid AS $$
DECLARE
  phone_id uuid;
BEGIN
  -- Essayer de trouver le téléphone existant
  SELECT id INTO phone_id 
  FROM public.customer_phones 
  WHERE customer_id = customer_id_param AND phone = phone_param;
  
  -- Si le téléphone n'existe pas, le créer
  IF phone_id IS NULL THEN
    INSERT INTO public.customer_phones (customer_id, phone, is_primary)
    VALUES (customer_id_param, phone_param, 
            CASE WHEN NOT EXISTS (SELECT 1 FROM public.customer_phones WHERE customer_id = customer_id_param AND is_primary = true) 
                 THEN true ELSE false END)
    RETURNING id INTO phone_id;
  END IF;
  
  RETURN phone_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir ou créer une adresse
CREATE OR REPLACE FUNCTION public.get_or_create_customer_address(customer_id_param uuid, address_param text)
RETURNS uuid AS $$
DECLARE
  address_id uuid;
BEGIN
  -- Essayer de trouver l'adresse existante
  SELECT id INTO address_id 
  FROM public.customer_addresses 
  WHERE customer_id = customer_id_param AND address = address_param;
  
  -- Si l'adresse n'existe pas, la créer
  IF address_id IS NULL THEN
    INSERT INTO public.customer_addresses (customer_id, address, is_primary)
    VALUES (customer_id_param, address_param, 
            CASE WHEN NOT EXISTS (SELECT 1 FROM public.customer_addresses WHERE customer_id = customer_id_param AND is_primary = true) 
                 THEN true ELSE false END)
    RETURNING id INTO address_id;
  END IF;
  
  RETURN address_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- MIGRATIONS DE DONNÉES
-- ========================================

-- Migration: mettre à jour les sessions existantes sans session_type
-- Cette migration doit être exécutée une seule fois après l'ajout du champ session_type
UPDATE public.sessions 
SET session_type = 'LIVE_TIKTOK' 
WHERE session_type IS NULL;

-- ========================================
-- VUES UTILES
-- ========================================

-- Vue pour les commandes avec informations complètes
CREATE OR REPLACE VIEW public.orders_with_details AS
SELECT 
  o.id,
  o.order_number,
  o.order_date,
  o.delivery_date,
  o.delivery_mode,
  o.payment_method,
  o.payment_reference,
  o.deposit_amount,
  o.total_amount,
  o.is_province,
  o.transport,
  o.order_status,
  o.created_at,
  o.updated_at,
  s.name as session_name,
  s.status as session_status,
  c.tiktok_name,
  c.real_name,
  cp.phone,
  ca.address
FROM public.orders o
JOIN public.sessions s ON o.session_id = s.id
JOIN public.customers c ON o.customer_id = c.id
LEFT JOIN public.customer_phones cp ON o.customer_phone_id = cp.id
LEFT JOIN public.customer_addresses ca ON o.customer_address_id = ca.id;

-- Vue pour les lignes de commande avec informations de commande
CREATE OR REPLACE VIEW public.order_lines_with_details AS
SELECT 
  ol.id,
  ol.code,
  ol.description,
  ol.unit_price,
  ol.quantity,
  ol.line_total,
  ol.status,
  ol.created_at,
  o.id as order_id,
  o.order_number,
  o.order_date,
  o.order_status,
  c.tiktok_name,
  c.real_name
FROM public.order_lines ol
JOIN public.orders o ON ol.order_id = o.id
JOIN public.customers c ON o.customer_id = c.id;

-- ========================================
-- COMMENTAIRES
-- ========================================

COMMENT ON TABLE public.customers IS 'Informations de base des clients';
COMMENT ON TABLE public.customer_phones IS 'Téléphones multiples par client';
COMMENT ON TABLE public.customer_addresses IS 'Adresses multiples par client';
COMMENT ON TABLE public.orders IS 'Commandes principales avec informations de livraison et paiement';
COMMENT ON TABLE public.order_lines IS 'Lignes de commande avec détails des produits';
COMMENT ON TABLE public.sessions IS 'Sessions de vente avec type (Live TikTok ou vente ordinaire)';
COMMENT ON COLUMN public.sessions.session_type IS 'Type de session: LIVE_TIKTOK ou VENTE_ORDINAIRE';
COMMENT ON TABLE public.profiles IS 'Profils utilisateurs avec rôles';

COMMENT ON COLUMN public.orders.order_number IS 'Numéro de commande unique';
COMMENT ON COLUMN public.orders.total_amount IS 'Montant total calculé automatiquement';
COMMENT ON COLUMN public.order_lines.line_total IS 'Total de la ligne (unit_price * quantity)';
COMMENT ON COLUMN public.customer_phones.is_primary IS 'Indique si c''est le téléphone principal du client';
COMMENT ON COLUMN public.customer_addresses.is_primary IS 'Indique si c''est l''adresse principale du client';

