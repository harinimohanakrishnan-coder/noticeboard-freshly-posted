import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { LogIn, AlertCircle, ExternalLink, FileText, Download } from 'lucide-react';

interface Notice {
  id: string;
  title: string;
  content: string;
  created_at: string;
  expires_at: string;
  category: string;
  priority: string;
  content_type: string;
  attachment_urls?: string[];
  link_url?: string;
  department?: string;
  year?: string;
}

const categoryColors: Record<string, string> = {
  academic: 'bg-blue-500',
  exams: 'bg-red-500',
  placements: 'bg-green-500',
  cultural: 'bg-purple-500',
  sports: 'bg-orange-500',
  circulars: 'bg-gray-500',
};

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchNotices();

    const channel = supabase
      .channel('notices-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notices'
        },
        () => {
          fetchNotices();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchNotices = async () => {
    const { data, error } = await supabase
      .from('notices')
      .select('*')
      .order('priority', { ascending: true })
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
    setLoading(false);
  };

  const filteredNotices = selectedCategory === 'all' 
    ? notices 
    : notices.filter(n => n.category === selectedCategory);

  const urgentNotices = notices.filter(n => n.priority === 'urgent');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading notices...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Digital Noticeboard</h1>
            <p className="text-muted-foreground">Stay updated with the latest announcements</p>
          </div>
          <Button onClick={() => navigate('/auth')} variant="outline">
            <LogIn className="mr-2 h-4 w-4" />
            Staff Login
          </Button>
        </div>

        {urgentNotices.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-red-600">
              <AlertCircle className="h-6 w-6" />
              Urgent Notices
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {urgentNotices.map((notice) => (
                <Card key={notice.id} className="border-2 border-red-500 bg-red-50 dark:bg-red-950">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-red-900 dark:text-red-100">{notice.title}</CardTitle>
                      <Badge className={categoryColors[notice.category]}>{notice.category}</Badge>
                    </div>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      Posted {formatDistanceToNow(new Date(notice.created_at), { addSuffix: true })}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap text-red-900 dark:text-red-100">{notice.content}</p>
                    {notice.attachment_urls && notice.attachment_urls.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {notice.attachment_urls.map((url, idx) => (
                          <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                            <Download className="h-4 w-4" />
                            Attachment {idx + 1}
                          </a>
                        ))}
                      </div>
                    )}
                    {notice.link_url && (
                      <a href={notice.link_url} target="_blank" rel="noopener noreferrer" className="mt-4 flex items-center gap-2 text-sm text-blue-600 hover:underline">
                        <ExternalLink className="h-4 w-4" />
                        View Link
                      </a>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <TabsList className="grid w-full grid-cols-7 mb-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="academic">Academic</TabsTrigger>
            <TabsTrigger value="exams">Exams</TabsTrigger>
            <TabsTrigger value="placements">Placements</TabsTrigger>
            <TabsTrigger value="cultural">Cultural</TabsTrigger>
            <TabsTrigger value="sports">Sports</TabsTrigger>
            <TabsTrigger value="circulars">Circulars</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-0">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredNotices.map((notice) => (
                <Card key={notice.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="line-clamp-2">{notice.title}</CardTitle>
                      <Badge className={categoryColors[notice.category]}>{notice.category}</Badge>
                    </div>
                    {(notice.department || notice.year) && (
                      <p className="text-xs text-muted-foreground">
                        {[notice.department, notice.year].filter(Boolean).join(' • ')}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Posted {formatDistanceToNow(new Date(notice.created_at), { addSuffix: true })}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap line-clamp-4">{notice.content}</p>
                    
                    {notice.content_type === 'image' && notice.attachment_urls && notice.attachment_urls[0] && (
                      <img src={notice.attachment_urls[0]} alt={notice.title} className="mt-4 rounded-lg w-full h-48 object-cover" />
                    )}
                    
                    {notice.content_type === 'video' && notice.attachment_urls && notice.attachment_urls[0] && (
                      <video controls className="mt-4 rounded-lg w-full">
                        <source src={notice.attachment_urls[0]} />
                      </video>
                    )}
                    
                    {notice.content_type === 'pdf' && notice.attachment_urls && (
                      <div className="mt-4 space-y-2">
                        {notice.attachment_urls.map((url, idx) => (
                          <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                            <FileText className="h-4 w-4" />
                            View PDF {notice.attachment_urls!.length > 1 ? `(${idx + 1})` : ''}
                          </a>
                        ))}
                      </div>
                    )}
                    
                    {notice.link_url && (
                      <a href={notice.link_url} target="_blank" rel="noopener noreferrer" className="mt-4 flex items-center gap-2 text-sm text-blue-600 hover:underline">
                        <ExternalLink className="h-4 w-4" />
                        View Link
                      </a>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredNotices.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No notices in this category.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;