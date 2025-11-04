-- Migration: Introduce billing_cycle enum and migrate column

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'billing_cycle') THEN
    CREATE TYPE billing_cycle AS ENUM ('monthly','quarterly','yearly','trial');
  END IF;
END$$;

-- Ensure the column exists before altering (idempotent safety)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'billing_cycle'
  ) THEN
    ALTER TABLE public.subscriptions
      ALTER COLUMN billing_cycle TYPE billing_cycle
      USING (
        CASE 
          WHEN billing_cycle IN ('monthly','quarterly','yearly','trial') THEN billing_cycle::billing_cycle
          ELSE 'monthly'::billing_cycle
        END
      );
  END IF;
END$$;


