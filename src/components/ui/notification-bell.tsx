import * as React from "react"
import { Bell, TrendingUp, Clock, AlertTriangle } from "lucide-react"
import { Button } from "./button"
import { Badge } from "./badge"
import { Card, CardContent } from "./card"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover"
import { cn } from "@/lib/utils"

interface Notification {
  id: string;
  type: 'high_activity' | 'expiring' | 'alert';
  title: string;
  message: string;
  timestamp: Date;
  isRead?: boolean;
}

interface NotificationBellProps {
  notifications?: Notification[];
}

const NotificationBell: React.FC<NotificationBellProps> = ({ 
  notifications = [
    {
      id: '1',
      type: 'high_activity',
      title: 'High Scan Activity',
      message: 'Your "Product Launch" QR code has received 50+ scans in the last hour!',
      timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
    },
    {
      id: '2',
      type: 'alert',
      title: 'New Feature Available',
      message: 'Multi-URL A/B testing is now available for dynamic QR codes.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    }
  ]
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'high_activity':
        return TrendingUp;
      case 'expiring':
        return Clock;
      case 'alert':
        return AlertTriangle;
      default:
        return Bell;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'high_activity':
        return 'text-secondary';
      case 'expiring':
        return 'text-yellow-500';
      case 'alert':
        return 'text-primary';
      default:
        return 'text-muted-foreground';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return timestamp.toLocaleDateString();
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="border-b p-4">
          <h4 className="font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <div className="max-h-64 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            notifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type);
              return (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 border-b last:border-b-0 hover:bg-muted/50 cursor-pointer",
                    !notification.isRead && "bg-primary/5"
                  )}
                >
                  <div className="flex gap-3">
                    <div className={cn("flex-shrink-0 mt-0.5", getNotificationColor(notification.type))}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTimestamp(notification.timestamp)}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
        {notifications.length > 0 && (
          <div className="p-4 border-t">
            <Button variant="ghost" size="sm" className="w-full text-xs">
              Mark all as read
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export { NotificationBell };