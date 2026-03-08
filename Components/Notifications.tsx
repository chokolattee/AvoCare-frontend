import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { API_BASE_URL as BASE_URL } from '../config/api';

// ─── Types ───────────────────────────────────────────────────────────────────

export type NotificationType =
  | 'new_post'       // someone posted in community
  | 'like'           // someone liked your post
  | 'comment'        // someone commented on your post
  | 'reply';         // someone replied to your comment

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;         // ISO date string
  userId?: string;           // optional: target user for per-user filtering
  navigateTo?: string;       // screen name to navigate to on tap
  navigateParams?: object;   // params passed to that screen
}

// ─── Helpers you can import in OTHER screens ─────────────────────────────────

/**
 * Push a new notification to the backend for a specific user.
 * Call this from any screen / API handler.
 *
 * Example:
 *   import { pushNotification } from '../Components/Notifications';
 *   await pushNotification({
 *     userId: '12345', // ID of the user who should receive the notification
 *     type: 'like',
 *     title: 'New Like',
 *     body: `${userName} liked your post`,
 *     navigateTo: 'PostDetail',
 *     navigateParams: { postId },
 *   });
 */
export async function pushNotification(
  payload: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    navigateTo?: string;
    navigateParams?: object;
  }
): Promise<void> {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      console.warn('⚠️ No token available for pushing notification');
      return;
    }

    const requestBody = {
      user_id: payload.userId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      navigateTo: payload.navigateTo,
      navigateParams: payload.navigateParams,
    };

    console.log('📤 Sending notification:', {
      url: `${BASE_URL}/api/notifications/`,
      recipientUserId: payload.userId,
      type: payload.type,
    });

    const response = await fetch(`${BASE_URL}/api/notifications/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to push notification:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
    } else {
      const result = await response.json();
      console.log('✅ Notification sent successfully:', result);
    }
  } catch (err) {
    console.error('❌ pushNotification error:', err);
  }
}

// ─── Icon map ─────────────────────────────────────────────────────────────────

function iconForType(type: NotificationType) {
  switch (type) {
    case 'new_post': return { name: 'newspaper-outline' as const, color: '#5d873e' };
    case 'like':     return { name: 'heart-outline' as const,      color: '#e74c3c' };
    case 'comment':  return { name: 'chatbubble-outline' as const,  color: '#3498db' };
    case 'reply':    return { name: 'return-down-forward-outline' as const, color: '#9b59b6' };
  }
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ─── Component ───────────────────────────────────────────────────────────────

interface NotificationsProps {
  /** Passed down from Header so the bell only renders when logged in */
  visible: boolean;
}

const Notifications: React.FC<NotificationsProps> = ({ visible }) => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [badgeScale] = useState(new Animated.Value(1));
  const navigation = useNavigation<any>();

  const unreadCount = notifications.filter((n) => !n.read).length;

  // ── load ──────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userId = await AsyncStorage.getItem('userId');
      
      if (!token || !userId) return;

      const response = await fetch(`${BASE_URL}/api/notifications/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error('Notifications load error:', err);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    load();

    // Poll for new notifications every 30 seconds when panel is open
    let interval: NodeJS.Timeout | null = null;
    if (open) {
      interval = setInterval(load, 30000); // 30 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [visible, open, load]);

  // Pulse badge when unread count increases
  useEffect(() => {
    if (unreadCount === 0) return;
    Animated.sequence([
      Animated.timing(badgeScale, { toValue: 1.4, duration: 150, useNativeDriver: true }),
      Animated.timing(badgeScale, { toValue: 1,   duration: 150, useNativeDriver: true }),
    ]).start();
  }, [unreadCount]);

  // ── actions ──────────────────────────────────────────────────────────────

  const markAllRead = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userId = await AsyncStorage.getItem('userId');
      
      if (!token || !userId) return;

      // Optimistically update UI
      const updated = notifications.map((n) => ({ ...n, read: true }));
      setNotifications(updated);

      const response = await fetch(`${BASE_URL}/api/notifications/${userId}/read-all`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (!response.ok) {
        // Revert on error
        await load();
      }
    } catch (err) {
      console.error('Mark all read error:', err);
      await load(); // Reload to get correct state
    }
  };

  const markRead = async (id: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      if (!token) return;

      // Optimistically update UI
      const updated = notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      setNotifications(updated);

      const response = await fetch(`${BASE_URL}/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (!response.ok) {
        // Revert on error
        await load();
      }
    } catch (err) {
      console.error('Mark read error:', err);
      await load();
    }
  };

  const clearAll = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userId = await AsyncStorage.getItem('userId');
      
      if (!token || !userId) return;

      // Optimistically update UI
      setNotifications([]);

      const response = await fetch(`${BASE_URL}/api/notifications/${userId}/clear`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (!response.ok) {
        // Reload on error
        await load();
      }
    } catch (err) {
      console.error('Clear all error:', err);
      await load();
    }
  };

  const handleTap = async (notif: AppNotification) => {
    await markRead(notif.id);
    setOpen(false);
    if (notif.navigateTo) {
      // PostDetail is nested in CommunityStack, so navigate to the parent stack first
      if (notif.navigateTo === 'PostDetail') {
        navigation.navigate('MainTabs', {
          screen: 'CommunityStack',
          params: {
            screen: 'PostDetail',
            params: notif.navigateParams ?? {},
          },
        });
      } else {
        navigation.navigate(notif.navigateTo, notif.navigateParams ?? {});
      }
    }
  };

  // ── render ────────────────────────────────────────────────────────────────

  if (!visible) return null;

  return (
    <View style={styles.wrapper}>
      {/* Bell button */}
      <TouchableOpacity
        style={styles.bellButton}
        onPress={() => { setOpen((o) => !o); if (!open) load(); }}
        activeOpacity={0.7}
      >
        <Ionicons
          name={open ? 'notifications' : 'notifications-outline'}
          size={24}
          color="#5d873e"
        />
        {unreadCount > 0 && (
          <Animated.View style={[styles.badge, { transform: [{ scale: badgeScale }] }]}>
            <Text style={styles.badgeText}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </Animated.View>
        )}
      </TouchableOpacity>

      {/* Dropdown panel */}
      {open && (
        <View style={styles.panel}>
          {/* Header */}
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Notifications</Text>
            <View style={styles.panelActions}>
              {unreadCount > 0 && (
                <TouchableOpacity onPress={markAllRead} style={styles.actionBtn}>
                  <Text style={styles.actionText}>Mark all read</Text>
                </TouchableOpacity>
              )}
              {notifications.length > 0 && (
                <TouchableOpacity onPress={clearAll} style={styles.actionBtn}>
                  <Ionicons name="trash-outline" size={16} color="#999" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          {/* List */}
          {notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="notifications-off-outline" size={40} color="#ccc" />
              <Text style={styles.emptyText}>No notifications yet</Text>
            </View>
          ) : (
            <FlatList
              data={notifications}
              keyExtractor={(item) => item.id}
              style={styles.list}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const icon = iconForType(item.type);
                return (
                  <TouchableOpacity
                    style={[styles.notifItem, !item.read && styles.unreadItem]}
                    onPress={() => handleTap(item)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.iconCircle, { backgroundColor: icon.color + '20' }]}>
                      <Ionicons name={icon.name} size={18} color={icon.color} />
                    </View>
                    <View style={styles.notifContent}>
                      <Text style={styles.notifTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.notifBody} numberOfLines={2}>
                        {item.body}
                      </Text>
                      <Text style={styles.notifTime}>{timeAgo(item.createdAt)}</Text>
                    </View>
                    {!item.read && <View style={styles.unreadDot} />}
                  </TouchableOpacity>
                );
              }}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )}
        </View>
      )}
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#e74c3c',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },

  // Panel
  panel: {
    position: 'absolute',
    top: 48,
    right: 0,
    width: 275,
    maxHeight: 440,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 9999,
    overflow: 'hidden',
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  panelTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2c3e50',
  },
  panelActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    padding: 4,
  },
  actionText: {
    fontSize: 12,
    color: '#5d873e',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  emptyText: {
    color: '#aaa',
    fontSize: 14,
  },

  // List
  list: {
    maxHeight: 360,
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  unreadItem: {
    backgroundColor: '#f5faf2',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    flexShrink: 0,
  },
  notifContent: {
    flex: 1,
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 2,
  },
  notifBody: {
    fontSize: 12,
    color: '#555',
    lineHeight: 17,
    marginBottom: 4,
  },
  notifTime: {
    fontSize: 11,
    color: '#aaa',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#5d873e',
    marginTop: 4,
    marginLeft: 6,
    flexShrink: 0,
  },
  separator: {
    height: 1,
    backgroundColor: '#f5f5f5',
    marginLeft: 62,
  },
});

export default Notifications;