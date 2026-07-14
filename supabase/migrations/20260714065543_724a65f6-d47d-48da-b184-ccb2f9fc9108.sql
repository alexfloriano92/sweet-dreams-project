
CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  entity text NOT NULL,
  entity_id uuid NOT NULL,
  action text NOT NULL,
  actor_id uuid,
  actor_name text,
  summary text,
  changes jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX audit_logs_store_created_idx ON public.audit_logs(store_id, created_at DESC);

GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner reads audit"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = audit_logs.store_id AND s.owner_id = auth.uid()));

-- Helper: get display name of an auth user
CREATE OR REPLACE FUNCTION public.audit_actor_name(_uid uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(p.full_name, u.email, _uid::text)
  FROM auth.users u LEFT JOIN public.profiles p ON p.id = u.id
  WHERE u.id = _uid;
$$;

-- Diff helper
CREATE OR REPLACE FUNCTION public.jsonb_diff(_old jsonb, _new jsonb)
RETURNS jsonb LANGUAGE sql IMMUTABLE AS $$
  SELECT COALESCE(jsonb_object_agg(key, jsonb_build_object('from', _old -> key, 'to', _new -> key)), '{}'::jsonb)
  FROM (
    SELECT key FROM jsonb_each(_new)
    WHERE _old -> key IS DISTINCT FROM _new -> key
    UNION
    SELECT key FROM jsonb_each(_old)
    WHERE _old -> key IS DISTINCT FROM _new -> key
  ) k
  WHERE key NOT IN ('updated_at','created_at');
$$;

-- Trigger for stores
CREATE OR REPLACE FUNCTION public.tg_audit_stores()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  diff jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs(store_id, entity, entity_id, action, actor_id, actor_name, summary)
    VALUES (NEW.id, 'store', NEW.id, 'created', uid, public.audit_actor_name(uid), 'Loja criada');
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    diff := public.jsonb_diff(to_jsonb(OLD), to_jsonb(NEW));
    IF diff <> '{}'::jsonb THEN
      INSERT INTO public.audit_logs(store_id, entity, entity_id, action, actor_id, actor_name, summary, changes)
      VALUES (NEW.id, 'store', NEW.id, 'updated', uid, public.audit_actor_name(uid),
              'Informações da loja atualizadas', diff);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs(store_id, entity, entity_id, action, actor_id, actor_name, summary)
    VALUES (OLD.id, 'store', OLD.id, 'deleted', uid, public.audit_actor_name(uid), 'Loja removida');
    RETURN OLD;
  END IF;
  RETURN NULL;
END $$;

CREATE TRIGGER audit_stores
AFTER INSERT OR UPDATE OR DELETE ON public.stores
FOR EACH ROW EXECUTE FUNCTION public.tg_audit_stores();

-- Trigger for vehicles
CREATE OR REPLACE FUNCTION public.tg_audit_vehicles()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  diff jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs(store_id, entity, entity_id, action, actor_id, actor_name, summary)
    VALUES (NEW.store_id, 'vehicle', NEW.id, 'created', uid, public.audit_actor_name(uid),
            'Veículo adicionado: ' || NEW.title);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    diff := public.jsonb_diff(to_jsonb(OLD), to_jsonb(NEW));
    IF diff <> '{}'::jsonb THEN
      INSERT INTO public.audit_logs(store_id, entity, entity_id, action, actor_id, actor_name, summary, changes)
      VALUES (NEW.store_id, 'vehicle', NEW.id, 'updated', uid, public.audit_actor_name(uid),
              'Veículo atualizado: ' || NEW.title, diff);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs(store_id, entity, entity_id, action, actor_id, actor_name, summary)
    VALUES (OLD.store_id, 'vehicle', OLD.id, 'deleted', uid, public.audit_actor_name(uid),
            'Veículo removido: ' || OLD.title);
    RETURN OLD;
  END IF;
  RETURN NULL;
END $$;

CREATE TRIGGER audit_vehicles
AFTER INSERT OR UPDATE OR DELETE ON public.vehicles
FOR EACH ROW EXECUTE FUNCTION public.tg_audit_vehicles();
