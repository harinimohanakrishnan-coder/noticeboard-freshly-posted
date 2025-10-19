import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { NoticeForm } from '@/components/NoticeForm';
import { NoticeList } from '@/components/NoticeList';
import { LogOut, Plus } from 'lucide-react';

interface Notice {
  id: string;
  title: string;
  content: string;
  created_at: string;
  expires_at: string;
}

const Dashboard = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchNotices();
    }
  }, [user]);

  const fetchNotices = async () => {
    const { data, error } = await supabase
      .from('notices')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error fetching notices',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      setNotices(data || []);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleEdit = (notice: Notice) => {
    setEditingNotice(notice);
    setIsCreating(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('notices')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error deleting notice',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Notice deleted',
        description: 'The notice has been removed successfully.'
      });
      fetchNotices();
    }
  };

  const handleFormSuccess = () => {
    setIsCreating(false);
    setEditingNotice(null);
    fetchNotices();
  };

  const handleCancelForm = () => {
    setIsCreating(false);
    setEditingNotice(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Notice Management</h1>
            <p className="text-muted-foreground">Create and manage noticeboard content</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/')} variant="outline">
              View Noticeboard
            </Button>
            <Button onClick={handleLogout} variant="ghost">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {isCreating ? (
          <Card>
            <CardHeader>
              <CardTitle>{editingNotice ? 'Edit Notice' : 'Create New Notice'}</CardTitle>
            </CardHeader>
            <CardContent>
              <NoticeForm
                notice={editingNotice}
                onSuccess={handleFormSuccess}
                onCancel={handleCancelForm}
              />
            </CardContent>
          </Card>
        ) : (
          <>
            <Button onClick={() => setIsCreating(true)} className="mb-6">
              <Plus className="mr-2 h-4 w-4" />
              Create New Notice
            </Button>
            <NoticeList
              notices={notices}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
