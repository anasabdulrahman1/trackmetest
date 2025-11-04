-- Migration: Unschedule hardcoded daily-subscription-rollover cron job
-- Rationale: avoid embedding service role secrets and hard-coded URLs in migrations.
-- Action: attempt to unschedule the job by name; if not supported, remove by deleting from cron.job.

-- Try unschedule by name (pg_cron >= 1.6)
DO $$
BEGIN
  BEGIN
    PERFORM cron.unschedule('daily-subscription-rollover');
  EXCEPTION WHEN OTHERS THEN
    -- Fallback: delete by jobname if available
    BEGIN
      IF EXISTS (SELECT 1 FROM pg_catalog.pg_namespace n WHERE n.nspname = 'cron') THEN
        IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-subscription-rollover') THEN
          DELETE FROM cron.job WHERE jobname = 'daily-subscription-rollover';
        END IF;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- ignore if pg_cron not installed or insufficient privileges
      NULL;
    END;
  END;
END$$;

-- NOTE: Recreate scheduling outside migrations using a secure method (e.g., Vault/Secrets or external scheduler).


