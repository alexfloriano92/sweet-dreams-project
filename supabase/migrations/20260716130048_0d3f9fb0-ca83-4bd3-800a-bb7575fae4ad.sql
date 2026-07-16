CREATE OR REPLACE FUNCTION public.enforce_single_admin()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  sole_admin uuid := '3f804cec-e281-47d9-9838-5e4b134dd11d';
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.role = 'admin' AND OLD.user_id = sole_admin THEN
      RAISE EXCEPTION 'O administrador principal não pode ser removido.';
    END IF;
    RETURN OLD;
  END IF;

  IF NEW.role = 'admin' AND NEW.user_id <> sole_admin THEN
    RAISE EXCEPTION 'Somente o proprietário do sistema pode ter o papel admin.';
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.role = 'admin' AND OLD.user_id = sole_admin
     AND (NEW.role <> 'admin' OR NEW.user_id <> sole_admin) THEN
    RAISE EXCEPTION 'O administrador principal não pode ser alterado.';
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS enforce_single_admin_trg ON public.user_roles;
CREATE TRIGGER enforce_single_admin_trg
BEFORE INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.enforce_single_admin();

-- Remove qualquer admin extra que porventura exista
DELETE FROM public.user_roles
WHERE role = 'admin' AND user_id <> '3f804cec-e281-47d9-9838-5e4b134dd11d';