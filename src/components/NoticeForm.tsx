import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface NoticeFormProps {
  notice?: {
    id: string;
    title: string;
    content: string;
  } | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const NoticeForm = ({ notice, onSuccess, onCancel }: NoticeFormProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: notice?.title || '',
    content: notice?.content || ''
  });

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

      if (notice) {
        const { error } = await supabase
          .from('notices')
          .update({
            title: formData.title,
            content: formData.content
          })
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
            title: formData.title,
            content: formData.content,
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
    <form onSubmit={handleSubmit} className="space-y-4">
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
      <div className="flex gap-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : notice ? 'Update Notice' : 'Create Notice'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};
