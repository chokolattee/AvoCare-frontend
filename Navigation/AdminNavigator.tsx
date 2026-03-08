import React, { useState, useEffect } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import {
  useWindowDimensions,
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Platform,
  Image,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import DashboardScreen from '../Screens/Admin/DashboardScreen';
import UsersScreen from '../Screens/Admin/UsersScreen';
import AnalysisScreen from '../Screens/Admin/AnalysisScreen';
import ForumScreen from '../Screens/Admin/ForumScreen';
import Header from '../Components/Header';
import ProductScreen from '../Screens/Admin/ProductScreen';
import OrderScreen from '../Screens/Admin/OrderScreen';
import ReviewScreen from '../Screens/Admin/ReviewScreen';
import Notifications from '../Components/Notifications';

export type AdminDrawerParamList = {
  Dashboard: undefined;
  Users: undefined;
  Forum: undefined;
  Analysis: undefined;
  Products: undefined;
  Orders: undefined;
  Reviews: undefined;
};

const Drawer = createDrawerNavigator<AdminDrawerParamList>();

// ── Mobile header ─────────────────────────────────────────────
const MobileHeader: React.FC<{ onMenuPress: () => void; title: string }> = ({
  onMenuPress,
  title,
}) => {
  const navigation = useNavigation<any>();
  const [user, setUser]               = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const loadUser = async () => {
    try {
      const token    = (await AsyncStorage.getItem('jwt')) || (await AsyncStorage.getItem('token'));
      const userData = await AsyncStorage.getItem('user');
      if (token && userData) setUser(JSON.parse(userData));
      else setUser(null);
    } catch { setUser(null); }
  };

  useEffect(() => { loadUser(); }, []);

  const handleLogout = async () => {
    try {
      setDropdownOpen(false);
      await AsyncStorage.multiRemove(['token', 'jwt', 'user', 'userId', 'username', 'accessToken']);
      setUser(null);
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.dispatchEvent(new Event('authChange'));
      }
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs', state: { routes: [{ name: 'Home' }], index: 0 } }],
      });
      setTimeout(() => Alert.alert('Success', 'Logged out successfully'), 300);
    } catch { /* ignore */ }
  };

  const handleNavigate = (screen: string) => {
    setDropdownOpen(false);
    navigation.navigate(screen);
  };

  return (
    <View style={mobileHeaderStyles.container}>

      {/* ── Left: Hamburger ── */}
      <TouchableOpacity
        onPress={onMenuPress}
        style={mobileHeaderStyles.hamburger}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        activeOpacity={0.7}
      >
        <View style={mobileHeaderStyles.bar} />
        <View style={mobileHeaderStyles.barMid} />
        <View style={mobileHeaderStyles.bar} />
      </TouchableOpacity>

      {/* ── Centre: Title ── */}
      <Text style={mobileHeaderStyles.title} numberOfLines={1}>{title}</Text>

      {/* ── Right: Bell + Avatar ── */}
      <View style={mobileHeaderStyles.rightGroup}>

        {/* Notification bell */}
        <Notifications visible={!!user} />

        {/* Avatar button */}
        {user ? (
          <View style={mobileHeaderStyles.userMenu}>
            <TouchableOpacity
              onPress={() => setDropdownOpen(prev => !prev)}
              style={mobileHeaderStyles.avatarBtn}
              activeOpacity={0.8}
            >
              <View style={mobileHeaderStyles.avatarWrap}>
                {user.image ? (
                  <Image source={{ uri: user.image }} style={mobileHeaderStyles.avatarImg} resizeMode="cover" />
                ) : (
                  <View style={mobileHeaderStyles.avatarFallback}>
                    <Text style={mobileHeaderStyles.avatarInitial}>
                      {user.name?.charAt(0).toUpperCase() ?? 'A'}
                    </Text>
                  </View>
                )}
                <View style={mobileHeaderStyles.statusDot} />
              </View>
            </TouchableOpacity>

            {/* ── Dropdown — mirrors Header.tsx ── */}
            {dropdownOpen && (
              <>
                {/* Invisible backdrop to close on outside tap */}
                <TouchableOpacity
                  style={mobileHeaderStyles.dropdownBackdrop}
                  activeOpacity={1}
                  onPress={() => setDropdownOpen(false)}
                />

                <View style={mobileHeaderStyles.dropdownMenu}>

                  {/* User info header */}
                  <View style={mobileHeaderStyles.dropdownHeader}>
                    <View style={mobileHeaderStyles.dropdownAvatarContainer}>
                      {user.image ? (
                        <Image source={{ uri: user.image }} style={mobileHeaderStyles.dropdownAvatar} resizeMode="cover" />
                      ) : (
                        <View style={mobileHeaderStyles.dropdownDefaultAvatar}>
                          <Text style={mobileHeaderStyles.dropdownAvatarText}>
                            {user.name?.charAt(0).toUpperCase() ?? 'A'}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={mobileHeaderStyles.userName}  numberOfLines={1}>{user.name}</Text>
                    <Text style={mobileHeaderStyles.userEmail} numberOfLines={1}>{user.email}</Text>
                  </View>

                  <View style={mobileHeaderStyles.dropdownDivider} />

                  {/* Menu items */}
                  <TouchableOpacity style={mobileHeaderStyles.dropdownItem} onPress={() => handleNavigate('Profile')} activeOpacity={0.7}>
                    <View style={mobileHeaderStyles.dropdownIconContainer}>
                      <Ionicons name="person-outline" size={20} color="#5d873e" />
                    </View>
                    <Text style={mobileHeaderStyles.dropdownText}>My Profile</Text>
                    <Ionicons name="chevron-forward" size={16} color="#999" />
                  </TouchableOpacity>

                  <TouchableOpacity style={mobileHeaderStyles.dropdownItem} onPress={() => handleNavigate('ListOrders')} activeOpacity={0.7}>
                    <View style={mobileHeaderStyles.dropdownIconContainer}>
                      <Ionicons name="list-outline" size={20} color="#5d873e" />
                    </View>
                    <Text style={mobileHeaderStyles.dropdownText}>My Orders</Text>
                    <Ionicons name="chevron-forward" size={16} color="#999" />
                  </TouchableOpacity>

                  <TouchableOpacity style={mobileHeaderStyles.dropdownItem} onPress={() => handleNavigate('History')} activeOpacity={0.7}>
                    <View style={mobileHeaderStyles.dropdownIconContainer}>
                      <Ionicons name="time-outline" size={20} color="#5d873e" />
                    </View>
                    <Text style={mobileHeaderStyles.dropdownText}>History</Text>
                    <Ionicons name="chevron-forward" size={16} color="#999" />
                  </TouchableOpacity>

                  <TouchableOpacity style={mobileHeaderStyles.dropdownItem} onPress={() => setDropdownOpen(false)} activeOpacity={0.7}>
                    <View style={mobileHeaderStyles.dropdownIconContainer}>
                      <Ionicons name="settings-outline" size={20} color="#5d873e" />
                    </View>
                    <Text style={mobileHeaderStyles.dropdownText}>Settings</Text>
                    <Ionicons name="chevron-forward" size={16} color="#999" />
                  </TouchableOpacity>

                  <View style={mobileHeaderStyles.dropdownDivider} />

                  <TouchableOpacity style={[mobileHeaderStyles.dropdownItem, mobileHeaderStyles.logoutItem]} onPress={handleLogout} activeOpacity={0.7}>
                    <View style={[mobileHeaderStyles.dropdownIconContainer, mobileHeaderStyles.logoutIconContainer]}>
                      <Ionicons name="log-out-outline" size={20} color="#e74c3c" />
                    </View>
                    <Text style={[mobileHeaderStyles.dropdownText, mobileHeaderStyles.logoutText]}>Logout</Text>
                  </TouchableOpacity>

                </View>
              </>
            )}
          </View>
        ) : null}
      </View>
    </View>
  );
};

const mobileHeaderStyles = StyleSheet.create({
  // ── Top bar ──
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 54 : 18,
    paddingBottom: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 100,
  },
  // ── Hamburger ──
  hamburger: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
    rowGap: 5,
  },
  bar: {
    width: 22,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: '#374151',
  },
  barMid: {
    width: 15,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: '#374151',
  },
  // ── Title ──
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: 0.15,
    textAlign: 'center',
    marginHorizontal: 6,
  },
  // ── Right group ──
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: 84,
    justifyContent: 'flex-end',
  },
  // ── Avatar button ──
  userMenu: {
    position: 'relative',
    zIndex: 200,
  },
  avatarBtn: {
    padding: 2,
  },
  avatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#5d873e',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#5d873e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  statusDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  // ── Dropdown backdrop ──
  dropdownBackdrop: {
    position: 'absolute',
    top: 44,
    right: -14,
    width: 9999,
    height: 9999,
    zIndex: 198,
  },
  // ── Dropdown menu — mirrors Header.tsx ──
  dropdownMenu: {
    position: 'absolute',
    top: 44,
    right: 0,
    width: 240,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
    borderWidth: 1,
    borderColor: 'rgba(93,135,62,0.12)',
    overflow: 'hidden',
    zIndex: 199,
  },
  dropdownHeader: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#f8fbf5',
  },
  dropdownAvatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#5d873e',
  },
  dropdownAvatar: {
    width: '100%',
    height: '100%',
  },
  dropdownDefaultAvatar: {
    width: '100%',
    height: '100%',
    backgroundColor: '#5d873e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownAvatarText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a2e12',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    color: '#7a9a60',
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: '#f0f4ed',
    marginHorizontal: 12,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
  },
  dropdownIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#f0f4ed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownText: {
    flex: 1,
    fontSize: 14,
    color: '#2d4a1e',
    fontWeight: '600',
  },
  logoutItem: {
    marginBottom: 4,
  },
  logoutIconContainer: {
    backgroundColor: '#fef2f2',
  },
  logoutText: {
    color: '#e74c3c',
  },
});

// ── Screen title map ──────────────────────────────────────────
const SCREEN_TITLES: Record<string, string> = {
  Dashboard: 'Dashboard',
  Users:     'Users',
  Forum:     'Forum',
  Analysis:  'Analysis',
  Products:  'Products',
  Orders:    'Orders',
  Reviews:   'Reviews',
};

// ── Navigator ─────────────────────────────────────────────────
const AdminNavigator = () => {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;

  return (
    <Drawer.Navigator
      initialRouteName="Dashboard"
      screenOptions={({ navigation, route }) => ({
        drawerActiveTintColor:       '#5d873e',
        drawerInactiveTintColor:     '#6b7280',
        drawerActiveBackgroundColor: '#f0f4ed',
        drawerStyle: {
          backgroundColor: '#fff',
          width: isLargeScreen ? 240 : 260,
          borderRightWidth: isLargeScreen ? 1 : 0,
          borderRightColor: '#e5e7eb',
        },
        drawerLabelStyle: { fontSize: 14, fontWeight: '600', marginLeft: 4 },
        drawerItemStyle: {
          borderRadius: 8,
          marginHorizontal: 8,
          marginVertical: 2,
          paddingVertical: 2,
          paddingLeft: 8,
        },
        drawerType:   isLargeScreen ? 'permanent' : 'front',
        swipeEnabled: !isLargeScreen,
        overlayColor: 'rgba(0,0,0,0.4)',
        header: () =>
          isLargeScreen ? (
            <Header onMenuPress={undefined} showNavLinks={false} />
          ) : (
            <MobileHeader
              onMenuPress={() => navigation.toggleDrawer()}
              title={SCREEN_TITLES[route.name] ?? route.name}
            />
          ),
      })}
    >
      <Drawer.Screen name="Dashboard" component={DashboardScreen}
        options={{ drawerLabel: 'Dashboard', drawerIcon: ({ color }) => <Ionicons name="grid" size={20} color={color} /> }} />
      <Drawer.Screen name="Users" component={UsersScreen}
        options={{ drawerLabel: 'Users', drawerIcon: ({ color }) => <Ionicons name="people" size={20} color={color} /> }} />
      <Drawer.Screen name="Forum" component={ForumScreen}
        options={{ drawerLabel: 'Forum', drawerIcon: ({ color }) => <Ionicons name="chatbubbles" size={20} color={color} /> }} />
      <Drawer.Screen name="Analysis" component={AnalysisScreen}
        options={{ drawerLabel: 'Analysis', drawerIcon: ({ color }) => <Ionicons name="bar-chart" size={20} color={color} /> }} />
      <Drawer.Screen name="Products" component={ProductScreen}
        options={{ drawerLabel: 'Products', drawerIcon: ({ color }) => <Ionicons name="cube" size={20} color={color} /> }} />
      <Drawer.Screen name="Orders" component={OrderScreen}
        options={{ drawerLabel: 'Orders', drawerIcon: ({ color }) => <Ionicons name="receipt" size={20} color={color} /> }} />
      <Drawer.Screen name="Reviews" component={ReviewScreen}
        options={{ drawerLabel: 'Reviews', drawerIcon: ({ color }) => <Ionicons name="star" size={20} color={color} /> }} />
    </Drawer.Navigator>
  );
};

export default AdminNavigator;