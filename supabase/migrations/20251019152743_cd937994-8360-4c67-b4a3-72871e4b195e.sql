-- Update app_role enum to include all roles
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'hod';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'faculty';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'placement_cell';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'exam_cell';

-- Create enums for notice categories and priorities
CREATE TYPE public.notice_category AS ENUM ('academic', 'exams', 'placements', 'cultural', 'sports', 'circulars');
CREATE TYPE public.notice_priority AS ENUM ('urgent', 'important', 'general');
CREATE TYPE public.content_type AS ENUM ('text', 'pdf', 'image', 'link', 'video');

-- Add new columns to notices table
ALTER TABLE public.notices 
ADD COLUMN IF NOT EXISTS category public.notice_category NOT NULL DEFAULT 'academic',
ADD COLUMN IF NOT EXISTS priority public.notice_priority NOT NULL DEFAULT 'general',
ADD COLUMN IF NOT EXISTS content_type public.content_type NOT NULL DEFAULT 'text',
ADD COLUMN IF NOT EXISTS target_audience TEXT[] DEFAULT ARRAY['whole_campus'],
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS year TEXT,
ADD COLUMN IF NOT EXISTS scheduled_publish_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS attachment_urls TEXT[],
ADD COLUMN IF NOT EXISTS link_url TEXT,
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

-- Create storage bucket for notice attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'notice-attachments',
  'notice-attachments',
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'video/mp4', 'video/webm', 'video/ogg']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for notice attachments
CREATE POLICY "Anyone can view notice attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'notice-attachments');

CREATE POLICY "Authenticated users can upload notice attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'notice-attachments' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update their own attachments"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'notice-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'notice-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Update RLS policies for notices to handle scheduled publishing
DROP POLICY IF EXISTS "Anyone can view active notices" ON public.notices;
CREATE POLICY "Anyone can view published active notices"
ON public.notices FOR SELECT
USING (
  expires_at > now() 
  AND is_published = true
  AND is_archived = false
  AND (scheduled_publish_date IS NULL OR scheduled_publish_date <= now())
);

-- Policy for staff to view all their notices including drafts
CREATE POLICY "Staff can view their own notices"
ON public.notices FOR SELECT
USING (auth.uid() = created_by);

-- Update insert policy to handle all new fields
DROP POLICY IF EXISTS "Authenticated users can create notices" ON public.notices;
CREATE POLICY "Authenticated users can create notices"
ON public.notices FOR INSERT
WITH CHECK (auth.uid() = created_by);