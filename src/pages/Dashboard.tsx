import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { NoticeForm } from '@/components/NoticeForm';
import { NoticeList } from '@/components/NoticeList';
import { LogOut, Plus, Archive, Search } from 'lucide-react';

const Dashboard = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notices, setNotices] = useState<any[]>([]);
  const [archivedNotices, setArchivedNotices] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingNotice, setEditingNotice] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
      .eq('is_archived', false)
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

  const fetchArchivedNotices = async () => {
    const { data, error } = await supabase
      .from('notices')
      .select('*')
      .eq('is_archived', true)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error fetching archived notices',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      setArchivedNotices(data || []);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleEdit = (notice: any) => {
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
      fetchArchivedNotices();
    }
  };

  const handleArchive = async (id: string, archived: boolean) => {
    const { error } = await supabase
      .from('notices')
      .update({ is_archived: archived })
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error archiving notice',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      toast({
        title: archived ? 'Notice archived' : 'Notice restored',
        description: archived ? 'The notice has been moved to archive.' : 'The notice has been restored.'
      });
      fetchNotices();
      fetchArchivedNotices();
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

  const filteredNotices = notices.filter(notice => 
    notice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    notice.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredArchivedNotices = archivedNotices.filter(notice =>
    notice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    notice.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
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
          <Tabs defaultValue="active" className="w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <TabsList>
                <TabsTrigger value="active">Active Notices</TabsTrigger>
                <TabsTrigger value="archive" onClick={() => fetchArchivedNotices()}>
                  <Archive className="mr-2 h-4 w-4" />
                  Archive
                </TabsTrigger>
              </TabsList>
              
              <div className="flex gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search notices..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button onClick={() => setIsCreating(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Notice
                </Button>
              </div>
            </div>

            <TabsContent value="active">
              <NoticeList
                notices={filteredNotices}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </TabsContent>

            <TabsContent value="archive">
              <NoticeList
                notices={filteredArchivedNotices}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
