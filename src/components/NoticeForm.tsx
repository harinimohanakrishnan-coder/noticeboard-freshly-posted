import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Upload, X } from 'lucide-react';

interface NoticeFormProps {
  notice?: any | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const NoticeForm = ({ notice, onSuccess, onCancel }: NoticeFormProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [formData, setFormData] = useState({
    title: notice?.title || '',
    content: notice?.content || '',
    category: notice?.category || 'academic',
    priority: notice?.priority || 'general',
    content_type: notice?.content_type || 'text',
    target_audience: notice?.target_audience || ['whole_campus'],
    department: notice?.department || '',
    year: notice?.year || '',
    link_url: notice?.link_url || '',
    scheduled_publish_date: notice?.scheduled_publish_date || '',
    is_published: notice?.is_published ?? true,
  });
  const [files, setFiles] = useState<File[]>([]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async (userId: string) => {
    if (files.length === 0) return [];
    
    setUploadingFiles(true);
    const uploadedUrls: string[] = [];

    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/${Date.now()}.${fileExt}`;

      const { error } = await supabase.storage
        .from('notice-attachments')
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('notice-attachments')
        .getPublicUrl(filePath);

      uploadedUrls.push(publicUrl);
    }

    setUploadingFiles(false);
    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: 'Error',
          description: 'You must be logged in to perform this action.',
          variant: 'destructive'
        });
        return;
      }

      const attachmentUrls = await uploadFiles(user.id);

      const noticeData = {
        title: formData.title,
        content: formData.content,
        category: formData.category,
        priority: formData.priority,
        content_type: formData.content_type,
        target_audience: formData.target_audience,
        department: formData.department || null,
        year: formData.year || null,
        link_url: formData.link_url || null,
        scheduled_publish_date: formData.scheduled_publish_date || null,
        is_published: formData.is_published,
        attachment_urls: attachmentUrls.length > 0 ? attachmentUrls : null,
      };

      if (notice) {
        const { error } = await supabase
          .from('notices')
          .update(noticeData)
          .eq('id', notice.id);

        if (error) throw error;

        toast({
          title: 'Notice updated',
          description: 'The notice has been updated successfully.'
        });
      } else {
        const { error } = await supabase
          .from('notices')
          .insert({
            ...noticeData,
            created_by: user.id
          });

        if (error) throw error;

        toast({
          title: 'Notice created',
          description: 'The notice will be visible for 30 days.'
        });
      }

      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Enter notice title"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="academic">Academic</SelectItem>
              <SelectItem value="exams">Exams</SelectItem>
              <SelectItem value="placements">Placements</SelectItem>
              <SelectItem value="cultural">Cultural</SelectItem>
              <SelectItem value="sports">Sports</SelectItem>
              <SelectItem value="circulars">Circulars</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="important">Important</SelectItem>
              <SelectItem value="general">General</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="content_type">Content Type</Label>
          <Select value={formData.content_type} onValueChange={(value) => setFormData({ ...formData, content_type: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="image">Image</SelectItem>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="link">Link</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="department">Department (Optional)</Label>
          <Input
            id="department"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            placeholder="e.g., Computer Science"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="year">Year (Optional)</Label>
          <Input
            id="year"
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: e.target.value })}
            placeholder="e.g., 2nd Year"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          placeholder="Enter notice content"
          rows={6}
          required
        />
      </div>

      {formData.content_type === 'link' && (
        <div className="space-y-2">
          <Label htmlFor="link_url">Link URL</Label>
          <Input
            id="link_url"
            type="url"
            value={formData.link_url}
            onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
            placeholder="https://example.com"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="files">Attachments (Images, PDFs, Videos)</Label>
        <div className="flex items-center gap-2">
          <Input
            id="files"
            type="file"
            multiple
            accept="image/*,application/pdf,video/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById('files')?.click()}
            disabled={uploadingFiles}
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Files
          </Button>
        </div>
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center gap-1 bg-secondary px-2 py-1 rounded text-sm">
                <span>{file.name}</span>
                <button type="button" onClick={() => removeFile(index)} className="ml-1">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="scheduled_publish_date">Schedule Publish (Optional)</Label>
          <Input
            id="scheduled_publish_date"
            type="datetime-local"
            value={formData.scheduled_publish_date}
            onChange={(e) => setFormData({ ...formData, scheduled_publish_date: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="is_published">Status</Label>
          <Select 
            value={formData.is_published ? 'published' : 'draft'} 
            onValueChange={(value) => setFormData({ ...formData, is_published: value === 'published' })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isLoading || uploadingFiles}>
          {isLoading || uploadingFiles ? 'Saving...' : notice ? 'Update Notice' : 'Create Notice'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};
