import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { io } from 'socket.io-client';
import { Bell, X, Check, AlertCircle, CheckCircle, Clock, MessageSquare, ArrowLeft } from 'lucide-react';
import { getSession } from '../../api/auth';
import { BASE_URL } from '../../api/client';

interface Notification {
  _id: string;
  type: 'booking' | 'status' | 'reminder' | 'system';
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

interface NotificationScreenProps {
  onClose?: () => void;
}

export function NotificationScreen({ onClose }: NotificationScreenProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // load notifications from API
  useEffect(() => {
    import('../../api/notifications').then(m => m.getNotifications())
      .then(data => setNotifications(data as Notification[]))
      .catch(err => console.error('fetch notifications', err));

    const socket = io(BASE_URL);
    const user = getSession();
    if (user) {
      socket.on('notification', (payload: any) => {
        if (payload.userId === user.id) {
          setNotifications(prev => [payload.notification, ...prev]);
        }
      });
    }
    return () => { socket.disconnect(); };
  }, []);

  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'booking':
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      case 'status':
        return <Clock className="w-5 h-5 text-purple-600" />;
      case 'reminder':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case 'system':
        return <Bell className="w-5 h-5 text-red-600" />;
      default:
        return <MessageSquare className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'booking':
        return 'bg-blue-50 border-blue-200';
      case 'status':
        return 'bg-purple-50 border-purple-200';
      case 'reminder':
        return 'bg-orange-50 border-orange-200';
      case 'system':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const handleMarkAsRead = (id: string) => {
    import('../../api/notifications').then(m => m.markNotificationAsRead(id))
      .then(() => {
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      })
      .catch(err => console.error('mark read', err));
  };

  const handleMarkAllAsRead = () => {
    notifications.filter(n => !n.isRead).forEach(n => {
      import('../../api/notifications').then(m => m.markNotificationAsRead(n._id)).catch(() => {});
    });
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleDelete = (id: string) => {
    import('../../api/notifications').then(m => m.deleteNotification(id))
      .then(() => setNotifications(prev => prev.filter(n => n._id !== id)))
      .catch(err => console.error('delete notification', err));
  };

  const handleDeleteAll = () => {
    import('../../api/notifications').then(m => m.deleteAllNotifications())
      .then(() => setNotifications([]))
      .catch(err => console.error('delete all notifications', err));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {!onClose && (
                <Link
                  to="/dashboard"
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-900"
                  title="Back to Dashboard"
                >
                  <ArrowLeft className="w-6 h-6" />
                </Link>
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
                {unreadCount > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            )}
          </div>

          {/* Filter & Actions */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors relative ${
                  filter === 'unread'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Unread
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Mark all as read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleDeleteAll}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        {filteredNotifications.length > 0 ? (
          <div className="space-y-4">
            {filteredNotifications.map(notification => (
              <div
                key={notification._id}
                className={`rounded-lg p-4 border-2 transition-all ${
                  notification.isRead
                    ? getNotificationColor(notification.type)
                    : 'bg-white border-blue-300 shadow-md'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-2 bg-white rounded-lg flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">
                          {notification.title}
                        </h3>
                        {!notification.isRead && (
                          <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                            NEW
                          </span>
                        )}
                      </div>

                      <p className="text-gray-600 text-sm mb-2 break-words">
                        {notification.message}
                      </p>

                      <p className="text-xs text-gray-500">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    {!notification.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(notification._id)}
                        className="p-2 hover:bg-white/80 rounded-lg transition-colors"
                        title="Mark as read"
                      >
                        <Check className="w-5 h-5 text-blue-600" />
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(notification._id)}
                      className="p-2 hover:bg-white/80 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-100 max-w-md mx-auto">
              <Bell className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
              </h2>
              <p className="text-gray-600">
                {filter === 'unread'
                  ? 'You are all caught up! Check back later for new updates.'
                  : 'You have no notifications yet.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Stats (Optional) */}
      {filteredNotifications.length > 0 && (
        <div className="max-w-3xl mx-auto px-4 py-8 border-t border-gray-200 mt-8">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{unreadCount}</p>
              <p className="text-sm text-gray-600">Unread</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">
                {notifications.filter(n => n.isRead).length}
              </p>

              <p className="text-sm text-gray-600">Read</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{notifications.length}</p>
              <p className="text-sm text-gray-600">Total</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
