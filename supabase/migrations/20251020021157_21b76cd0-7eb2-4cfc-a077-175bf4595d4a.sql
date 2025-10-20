-- Add account status enum
CREATE TYPE public.account_status AS ENUM ('pending', 'approved', 'rejected');

-- Add account_status column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN account_status account_status NOT NULL DEFAULT 'pending';

-- Update RLS policies to only allow approved users to create/edit notices
DROP POLICY IF EXISTS "Authenticated users can create notices" ON public.notices;
CREATE POLICY "Approved users can create notices" 
ON public.notices 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = created_by AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND account_status = 'approved'
  )
);

-- Update policy for updating notices
DROP POLICY IF EXISTS "Users can update own notices" ON public.notices;
CREATE POLICY "Approved users can update own notices" 
ON public.notices 
FOR UPDATE 
TO authenticated
USING (
  auth.uid() = created_by AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND account_status = 'approved'
  )
);

-- Update policy for deleting notices
DROP POLICY IF EXISTS "Users can delete own notices" ON public.notices;
CREATE POLICY "Approved users can delete own notices" 
ON public.notices 
FOR DELETE 
TO authenticated
USING (
  auth.uid() = created_by AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND account_status = 'approved'
  )
);

-- Add policy for admins to view all profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add policy for admins to update profile status
CREATE POLICY "Admins can update profile status" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));