import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { NoticeForm } from '@/components/NoticeForm';
import { NoticeList } from '@/components/NoticeList';
import { AdminPanel } from '@/components/AdminPanel';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LogOut, Plus, Archive, Search, FileText, Activity, Eye, Users } from 'lucide-react';

const Dashboard = () => {
  const { user, accountStatus, isAdmin, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notices, setNotices] = useState<any[]>([]);
  const [archivedNotices, setArchivedNotices] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingNotice, setEditingNotice] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    archived: 0,
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    } else if (!loading && user && accountStatus === 'pending') {
      toast({
        title: 'Account Pending',
        description: 'Your account is awaiting admin approval.',
        variant: 'destructive'
      });
      navigate('/auth');
    } else if (!loading && user && accountStatus === 'rejected') {
      toast({
        title: 'Account Rejected',
        description: 'Your account registration was rejected.',
        variant: 'destructive'
      });
      navigate('/auth');
    } else if (user && accountStatus === 'approved') {
      fetchNotices();
      fetchArchivedNotices();
    }
  }, [user, accountStatus, loading, navigate]);

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
      const noticeData = data || [];
      setNotices(noticeData);
      
      const active = noticeData.filter(n => new Date(n.expires_at) > new Date()).length;
      setStats(prev => ({
        ...prev,
        total: noticeData.length,
        active: active,
      }));
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
      const archivedData = data || [];
      setArchivedNotices(archivedData);
      setStats(prev => ({
        ...prev,
        archived: archivedData.length,
      }));
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
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome to TPGIT Digital Notice Board</p>
          </div>
          <div className="flex gap-2">
            <ThemeToggle />
            <Button onClick={() => navigate('/')} variant="outline">
              View Noticeboard
            </Button>
            <Button onClick={handleLogout} variant="ghost">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Notices</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">All your notices</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Notices</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
              <p className="text-xs text-muted-foreground">Currently visible</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Archived</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.archived}</div>
              <p className="text-xs text-muted-foreground">Past notices</p>
            </CardContent>
          </Card>
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
                {isAdmin && (
                  <TabsTrigger value="admin">
                    <Users className="mr-2 h-4 w-4" />
                    User Management
                  </TabsTrigger>
                )}
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
              <Card>
                <CardHeader>
                  <CardTitle>Archived Notices</CardTitle>
                  <CardDescription>View your archived notices</CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredArchivedNotices.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No archived notices</p>
                  ) : (
                    <NoticeList
                      notices={filteredArchivedNotices}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {isAdmin && (
              <TabsContent value="admin">
                <AdminPanel />
              </TabsContent>
            )}
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
