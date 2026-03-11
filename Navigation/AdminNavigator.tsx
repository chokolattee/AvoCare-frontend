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
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import DashboardScreen from '../Screens/Admin/DashboardScreen';
import UsersScreen from '../Screens/Admin/UsersScreen';
import AnalysisScreen from '../Screens/Admin/AnalysisScreen';
import ForumScreen from '../Screens/Admin/ForumScreen';
import ProductScreen from '../Screens/Admin/ProductScreen';
import OrderScreen from '../Screens/Admin/OrderScreen';
import ReviewScreen from '../Screens/Admin/ReviewScreen';
import Notifications from '../Components/Notifications';

export type AdminDrawerParamList = {
  Dashboard: undefined;
  Users:     undefined;
  Forum:     undefined;
  Analysis:  undefined;
  Products:  undefined;
  Orders:    undefined;
  Reviews:   undefined;
};

const Drawer = createDrawerNavigator<AdminDrawerParamList>();

// ── Palette ───────────────────────────────────────────────────────────────────
const P = {
  bg:         '#f5faf0',
  active:     '#2D5016',
  activeBg:   '#E0EDD5',
  text:       '#2D5016',
  white:      '#ffffff',
  border:     '#C5D9B0',
  sectionLbl: '#6A8A50',
  headerBg:   '#2D5016',
  red:        '#e74c3c',
  redBg:      '#fef2f2',
};

// ── Nav item type ─────────────────────────────────────────────────────────────
interface NavItem {
  key: keyof AdminDrawerParamList;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconActive: React.ComponentProps<typeof Ionicons>['name'];
}

const OVERVIEW_ITEMS: NavItem[] = [
  { key: 'Dashboard', label: 'Dashboard', icon: 'grid-outline',        iconActive: 'grid'        },
  { key: 'Users',     label: 'Users',     icon: 'people-outline',      iconActive: 'people'      },
  { key: 'Analysis',  label: 'Analysis',  icon: 'bar-chart-outline',   iconActive: 'bar-chart'   },
  { key: 'Forum',     label: 'Forum',     icon: 'chatbubbles-outline',  iconActive: 'chatbubbles' },
];

const STORE_ITEMS: NavItem[] = [
  { key: 'Products', label: 'Products', icon: 'cube-outline',    iconActive: 'cube'    },
  { key: 'Orders',   label: 'Orders',   icon: 'receipt-outline', iconActive: 'receipt' },
  { key: 'Reviews',  label: 'Reviews',  icon: 'star-outline',    iconActive: 'star'    },
];

// ── Custom Drawer Content ─────────────────────────────────────────────────────
function CustomDrawerContent(props: any) {
  const { state, navigation: drawerNav } = props;
  const navigation = useNavigation<any>();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const token    = (await AsyncStorage.getItem('jwt')) || (await AsyncStorage.getItem('token'));
        const userData = await AsyncStorage.getItem('user');
        if (token && userData) setUser(JSON.parse(userData));
        else setUser(null);
      } catch { setUser(null); }
    };
    load();
  }, []);

  const activeRoute = state.routes[state.index]?.name;

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(['token', 'jwt', 'user', 'userId', 'username', 'accessToken']);
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.dispatchEvent(new Event('authChange'));
      }
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs', state: { routes: [{ name: 'Home' }], index: 0 } }] });
    } catch { /* ignore */ }
  };

  const renderItem = (item: NavItem) => {
    const isActive = activeRoute === item.key;
    return (
      <TouchableOpacity
        key={item.key}
        style={[d.navItem, isActive && d.navItemActive]}
        onPress={() => drawerNav.navigate(item.key)}
        activeOpacity={0.75}
      >
        <View style={[d.navIconWrap, isActive && d.navIconWrapActive]}>
          <Ionicons name={isActive ? item.iconActive : item.icon} size={18} color={isActive ? P.white : P.active} />
        </View>
        <Text style={[d.navLabel, isActive && d.navLabelActive]}>{item.label}</Text>
        {isActive && <View style={d.activePip} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={d.container}>
      {/* Profile strip */}
      <View style={d.profileHeader}>
        <View style={d.profile}>
          <View style={d.avatarWrap}>
            {user?.image ? (
              <Image source={{ uri: user.image }} style={d.avatarImg} resizeMode="cover" />
            ) : (
              <View style={d.avatarFallback}>
                <Text style={d.avatarInitial}>{user?.name?.charAt(0).toUpperCase() ?? 'A'}</Text>
              </View>
            )}
            <View style={d.onlineDot} />
          </View>
          <View style={d.profileText}>
            <Text style={d.profileName} numberOfLines={1}>{user?.name ?? 'Admin'}</Text>
            <View style={d.roleBadge}>
              <Ionicons name="shield-checkmark" size={10} color="#7aff5e" />
              <Text style={d.roleText}>Administrator</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={d.divider} />

      {/* Navigation */}
      <ScrollView style={d.scroll} showsVerticalScrollIndicator={false}>
        <Text style={d.sectionLabel}>OVERVIEW</Text>
        {OVERVIEW_ITEMS.map(renderItem)}
        <View style={d.divider} />
        <Text style={d.sectionLabel}>STORE MANAGEMENT</Text>
        {STORE_ITEMS.map(renderItem)}
      </ScrollView>

      {/* Logout */}
      <View style={d.bottomSection}>
        <View style={d.divider} />
        <TouchableOpacity style={d.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color={P.red} />
          <Text style={d.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Drawer stylesheet ─────────────────────────────────────────────────────────
const d = StyleSheet.create({
  container:         { flex: 1, backgroundColor: P.bg },
  scroll:            { flex: 1, paddingHorizontal: 8, paddingTop: 4 },
  profileHeader:     { backgroundColor: P.headerBg, paddingBottom: 4 },
  profile:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 20, paddingBottom: 16, gap: 12 },
  avatarWrap:        { width: 46, height: 46, borderRadius: 23, position: 'relative' },
  avatarImg:         { width: 46, height: 46, borderRadius: 23 },
  avatarFallback:    { width: 46, height: 46, borderRadius: 23, backgroundColor: '#4A7C2F', alignItems: 'center', justifyContent: 'center' },
  avatarInitial:     { color: P.white, fontSize: 18, fontWeight: '800' },
  onlineDot:         { position: 'absolute', bottom: 1, right: 1, width: 11, height: 11, borderRadius: 6, backgroundColor: '#22c55e', borderWidth: 2, borderColor: P.headerBg },
  profileText:       { flex: 1 },
  profileName:       { fontSize: 15, fontWeight: '700', color: P.white, marginBottom: 4 },
  roleBadge:         { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20, alignSelf: 'flex-start' },
  roleText:          { fontSize: 10, fontWeight: '700', color: '#7aff5e', letterSpacing: 0.5 },
  divider:           { height: 1, backgroundColor: P.border, marginHorizontal: 12, marginVertical: 6 },
  sectionLabel:      { fontSize: 10, fontWeight: '700', color: P.sectionLbl, letterSpacing: 1.2, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 6 },
  navItem:           { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, marginBottom: 2 },
  navItemActive:     { backgroundColor: P.activeBg },
  navIconWrap:       { width: 34, height: 34, borderRadius: 9, backgroundColor: '#E8F0DF', alignItems: 'center', justifyContent: 'center' },
  navIconWrapActive: { backgroundColor: P.active },
  navLabel:          { flex: 1, fontSize: 14, fontWeight: '600', color: P.text },
  navLabelActive:    { color: P.active, fontWeight: '700' },
  activePip:         { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4A7C2F' },
  bottomSection:     { paddingBottom: Platform.OS === 'ios' ? 28 : 16 },
  logoutBtn:         { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 12, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 10, backgroundColor: P.redBg },
  logoutText:        { fontSize: 14, fontWeight: '700', color: P.red },
});

// ── Mobile Header ─────────────────────────────────────────────────────────────
const MobileHeader: React.FC<{ onMenuPress: () => void; title: string }> = ({
  onMenuPress,
  title,
}) => {
  const navigation = useNavigation<any>();
  const [user, setUser]                 = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token    = (await AsyncStorage.getItem('jwt')) || (await AsyncStorage.getItem('token'));
        const userData = await AsyncStorage.getItem('user');
        if (token && userData) setUser(JSON.parse(userData));
        else setUser(null);
      } catch { setUser(null); }
    };
    loadUser();
  }, []);

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
    <View style={mh.container}>
      <TouchableOpacity
        onPress={onMenuPress}
        style={mh.hamburger}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        activeOpacity={0.7}
      >
        <View style={mh.bar} />
        <View style={mh.barMid} />
        <View style={mh.bar} />
      </TouchableOpacity>

      <View style={mh.titleRow}>
        <View style={mh.adminBadge}>
          <Ionicons name="shield-checkmark" size={11} color="#7aff5e" />
          <Text style={mh.adminBadgeText}>ADMIN</Text>
        </View>
        <Text style={mh.title} numberOfLines={1}>{title}</Text>
      </View>

      <View style={mh.rightGroup}>
        <Notifications visible={!!user} />
        {user ? (
          <View style={mh.userMenu}>
            <TouchableOpacity
              onPress={() => setDropdownOpen(prev => !prev)}
              style={mh.avatarBtn}
              activeOpacity={0.8}
            >
              <View style={mh.avatarWrap}>
                {user.image ? (
                  <Image source={{ uri: user.image }} style={mh.avatarImg} resizeMode="cover" />
                ) : (
                  <View style={mh.avatarFallback}>
                    <Text style={mh.avatarInitial}>
                      {user.name?.charAt(0).toUpperCase() ?? 'A'}
                    </Text>
                  </View>
                )}
                <View style={mh.statusDot} />
              </View>
            </TouchableOpacity>

            {dropdownOpen && (
              <>
                <TouchableOpacity
                  style={mh.dropdownBackdrop}
                  activeOpacity={1}
                  onPress={() => setDropdownOpen(false)}
                />
                <View style={mh.dropdownMenu}>
                  <View style={mh.dropdownHeader}>
                    <View style={mh.dropdownAvatarContainer}>
                      {user.image ? (
                        <Image source={{ uri: user.image }} style={mh.dropdownAvatar} resizeMode="cover" />
                      ) : (
                        <View style={mh.dropdownDefaultAvatar}>
                          <Text style={mh.dropdownAvatarText}>
                            {user.name?.charAt(0).toUpperCase() ?? 'A'}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={mh.userName}  numberOfLines={1}>{user.name}</Text>
                    <Text style={mh.userEmail} numberOfLines={1}>{user.email}</Text>
                  </View>
                  <View style={mh.dropdownDivider} />
                  <TouchableOpacity style={mh.dropdownItem} onPress={() => handleNavigate('Profile')} activeOpacity={0.7}>
                    <View style={mh.dropdownIconContainer}><Ionicons name="person-outline" size={20} color="#5d873e" /></View>
                    <Text style={mh.dropdownText}>My Profile</Text>
                    <Ionicons name="chevron-forward" size={16} color="#999" />
                  </TouchableOpacity>
                  <TouchableOpacity style={mh.dropdownItem} onPress={() => handleNavigate('ListOrders')} activeOpacity={0.7}>
                    <View style={mh.dropdownIconContainer}><Ionicons name="list-outline" size={20} color="#5d873e" /></View>
                    <Text style={mh.dropdownText}>My Orders</Text>
                    <Ionicons name="chevron-forward" size={16} color="#999" />
                  </TouchableOpacity>
                  <TouchableOpacity style={mh.dropdownItem} onPress={() => handleNavigate('History')} activeOpacity={0.7}>
                    <View style={mh.dropdownIconContainer}><Ionicons name="time-outline" size={20} color="#5d873e" /></View>
                    <Text style={mh.dropdownText}>History</Text>
                    <Ionicons name="chevron-forward" size={16} color="#999" />
                  </TouchableOpacity>
                  <View style={mh.dropdownDivider} />
                  <TouchableOpacity style={[mh.dropdownItem, mh.logoutItem]} onPress={handleLogout} activeOpacity={0.7}>
                    <View style={[mh.dropdownIconContainer, mh.logoutIconContainer]}>
                      <Ionicons name="log-out-outline" size={20} color="#e74c3c" />
                    </View>
                    <Text style={[mh.dropdownText, mh.logoutText]}>Logout</Text>
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

// ── Mobile Header stylesheet ──────────────────────────────────────────────────
const mh = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.headerBg,         // dark green — matches screen headers
    paddingTop: Platform.OS === 'ios' ? 54 : 18,
    paddingBottom: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1a3a10',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 100,
  },
  hamburger:             { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start', rowGap: 5 },
  bar:                   { width: 22, height: 2.5, borderRadius: 2, backgroundColor: P.white },   // white bars on dark bg
  barMid:                { width: 15, height: 2.5, borderRadius: 2, backgroundColor: P.white },   // white bars on dark bg
  titleRow:              { flex: 1, alignItems: 'center', gap: 2 },
  adminBadge:            { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20 },
  adminBadgeText:        { fontSize: 9, fontWeight: '800', color: '#7aff5e', letterSpacing: 1 },
  title:                 { fontSize: 16, fontWeight: '700', color: P.white, letterSpacing: 0.2 },
  rightGroup:            { flexDirection: 'row', alignItems: 'center', gap: 6, width: 84, justifyContent: 'flex-end' },
  userMenu:              { position: 'relative', zIndex: 200 },
  avatarBtn:             { padding: 2 },
  avatarWrap:            { width: 36, height: 36, borderRadius: 18, overflow: 'hidden', borderWidth: 2, borderColor: '#7aff5e' },
  avatarImg:             { width: '100%', height: '100%' },
  avatarFallback:        { width: '100%', height: '100%', backgroundColor: '#4A7C2F', justifyContent: 'center', alignItems: 'center' },
  avatarInitial:         { color: '#fff', fontSize: 15, fontWeight: '800' },
  statusDot:             { position: 'absolute', bottom: 1, right: 1, width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e', borderWidth: 1.5, borderColor: P.headerBg },
  dropdownBackdrop:      { position: 'absolute', top: 44, right: -14, width: 9999, height: 9999, zIndex: 198 },
  dropdownMenu:          { position: 'absolute', top: 44, right: 0, width: 240, backgroundColor: '#fff', borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 20, borderWidth: 1, borderColor: 'rgba(93,135,62,0.12)', overflow: 'hidden', zIndex: 199 },
  dropdownHeader:        { padding: 16, alignItems: 'center', backgroundColor: '#f8fbf5' },
  dropdownAvatarContainer: { width: 56, height: 56, borderRadius: 28, overflow: 'hidden', marginBottom: 8, borderWidth: 2, borderColor: '#5d873e' },
  dropdownAvatar:        { width: '100%', height: '100%' },
  dropdownDefaultAvatar: { width: '100%', height: '100%', backgroundColor: '#5d873e', justifyContent: 'center', alignItems: 'center' },
  dropdownAvatarText:    { color: '#fff', fontSize: 22, fontWeight: '700' },
  userName:              { fontSize: 15, fontWeight: '700', color: '#1a2e12', marginBottom: 2 },
  userEmail:             { fontSize: 12, color: '#7a9a60' },
  dropdownDivider:       { height: 1, backgroundColor: '#f0f4ed', marginHorizontal: 12 },
  dropdownItem:          { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, gap: 10 },
  dropdownIconContainer: { width: 34, height: 34, borderRadius: 8, backgroundColor: '#f0f4ed', justifyContent: 'center', alignItems: 'center' },
  dropdownText:          { flex: 1, fontSize: 14, color: '#2d4a1e', fontWeight: '600' },
  logoutItem:            { marginBottom: 4 },
  logoutIconContainer:   { backgroundColor: '#fef2f2' },
  logoutText:            { color: '#e74c3c' },
});

// ── Screen title map ──────────────────────────────────────────────────────────
const SCREEN_TITLES: Record<string, string> = {
  Dashboard: 'Dashboard',
  Users:     'Users',
  Forum:     'Forum',
  Analysis:  'Analysis',
  Products:  'Products',
  Orders:    'Orders',
  Reviews:   'Reviews',
};

// ── Navigator ─────────────────────────────────────────────────────────────────
const AdminNavigator = () => {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;

  return (
    <Drawer.Navigator
      initialRouteName="Dashboard"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={({ navigation, route }) => ({
        drawerType:   isLargeScreen ? 'permanent' : 'front',
        swipeEnabled: !isLargeScreen,
        overlayColor: 'rgba(0,0,0,0.55)',
        header: () =>
          isLargeScreen ? null : (
            <MobileHeader
              onMenuPress={() => navigation.toggleDrawer()}
              title={SCREEN_TITLES[route.name] ?? route.name}
            />
          ),
      })}
    >
      {[...OVERVIEW_ITEMS, ...STORE_ITEMS].map((item) => (
        <Drawer.Screen
          key={item.key}
          name={item.key}
          component={
            item.key === 'Dashboard' ? DashboardScreen :
            item.key === 'Users'     ? UsersScreen     :
            item.key === 'Forum'     ? ForumScreen     :
            item.key === 'Analysis'  ? AnalysisScreen  :
            item.key === 'Products'  ? ProductScreen   :
            item.key === 'Orders'    ? OrderScreen     :
                                       ReviewScreen
          }
        />
      ))}
    </Drawer.Navigator>
  );
};

export default AdminNavigator;