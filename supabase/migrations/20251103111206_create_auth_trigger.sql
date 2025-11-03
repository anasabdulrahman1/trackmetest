-- 1. Create the function to link auth.users to public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert a new row into our public.profiles table
  INSERT INTO public.profiles (id, email)
  -- 'new.id' and 'new.email' are special variables that come from the auth.users table
  VALUES (new.id, new.email); 
  RETURN new;
END;
$$;

-- 2. Create the trigger to run the function on new user sign-up
CREATE OR REPLACE TRIGGER on_auth_user_created
  -- This trigger will fire AFTER a new row is inserted into auth.users
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();