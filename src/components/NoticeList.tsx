import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, FileText, Image, Video, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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
  is_published: boolean;
  department?: string;
  year?: string;
}

interface NoticeListProps {
  notices: Notice[];
  onEdit: (notice: Notice) => void;
  onDelete: (id: string) => void;
}

const categoryColors: Record<string, string> = {
  academic: 'bg-blue-500',
  exams: 'bg-red-500',
  placements: 'bg-green-500',
  cultural: 'bg-purple-500',
  sports: 'bg-orange-500',
  circulars: 'bg-gray-500',
};

const priorityColors: Record<string, string> = {
  urgent: 'bg-red-600 text-white',
  important: 'bg-yellow-600 text-white',
  general: 'bg-blue-600 text-white',
};

export const NoticeList = ({ notices, onEdit, onDelete }: NoticeListProps) => {
  if (notices.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No notices yet. Create your first notice!</p>
      </div>
    );
  }

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="h-4 w-4" />;
      case 'image': return <Image className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'link': return <LinkIcon className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {notices.map((notice) => (
        <Card key={notice.id} className="relative">
          {notice.priority === 'urgent' && (
            <div className="absolute -top-2 -right-2">
              <Badge className={priorityColors[notice.priority]}>
                <AlertCircle className="h-3 w-3 mr-1" />
                URGENT
              </Badge>
            </div>
          )}
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="line-clamp-1 text-base">{notice.title}</CardTitle>
              {getContentIcon(notice.content_type)}
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className={categoryColors[notice.category]}>
                {notice.category}
              </Badge>
              {notice.priority !== 'general' && (
                <Badge variant="outline" className={priorityColors[notice.priority]}>
                  {notice.priority}
                </Badge>
              )}
              {!notice.is_published && (
                <Badge variant="secondary">Draft</Badge>
              )}
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
            <p className="line-clamp-3 text-sm">{notice.content}</p>
            {notice.attachment_urls && notice.attachment_urls.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                {notice.attachment_urls.length} attachment(s)
              </p>
            )}
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(notice)}
            >
              <Pencil className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(notice.id)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};