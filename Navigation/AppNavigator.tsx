import { NavigationContainer, useNavigationState } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator, StackScreenProps } from '@react-navigation/stack';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  View, StyleSheet, Platform, Modal, ScrollView,
  Animated, TouchableOpacity, Text, Dimensions, DeviceEventEmitter,
} from 'react-native';
import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const getScreenWidth = () => Dimensions.get('window').width;

import Header from '../Components/Header';
import HomeScreen from '../Screens/HomeScreen';
import FruitScanScreen from '../Screens/FruitScanScreen';
import LeafScanScreen from '../Screens/LeafScanScreen';
import CommunityScreen from '../Screens/Forum/CommunityScreen';
import MarketScreen from '../Screens/Market/MarketScreen';
import LoginScreen    from '../Screens/Auth/LoginScreen';
import RegisterScreen from '../Screens/Auth/RegisterScreen';
import ProfileScreen from '../Screens/Auth/ProfileScreen';
import VerifyEmailScreen from '../Screens/Auth/VerifyEmailScreen';
import PostDetailScreen from '../Screens/Forum/PostDetailScreen';
import EditPostScreen from '../Screens/Forum/EditPostScreen';
import AboutScreen from '../Screens/AboutScreen'; // ← renamed from AboutScreen
import AdminNavigator from './AdminNavigator';
import HistoryScreen from '../Screens/HistoryScreen';
import ProductDetailScreen from '../Screens/Market/ProductDetailScreen';
import FloatingChatbot from '../Components/FloatingChatbot';
import Cart from '../Screens/Cart/Cart';
import ShippingScreen from '../Screens/Cart/ShippingScreen';
import ListOrdersScreen from '../Screens/Market/ListOrdersScreen';
import ListReviewsScreen from '../Screens/Review/MyReviewsScreen';
import ConfirmOrderScreen from '../Screens/Cart/ConfirmOrderScreen';
import PaymentScreen from '../Screens/Cart/PaymentScreen';
import OrderSuccessScreen from '../Screens/Cart/OrderSuccessScreen';
import OrderDetails from '../Screens/Market/OrderDetailsScreen';
import CreateReviewScreen from '../Screens/Market/CreateReviewScreen';

// ─────────────────────────────────────────────────────────────
// Type definitions
// ─────────────────────────────────────────────────────────────

export interface ShippingInfo {
  address: string; city: string; postalCode: string; phoneNo: string; country: string;
}
export interface OrderPricing {
  itemsPrice: number; shippingPrice: number; taxPrice: number; totalPrice: number;
}

export type TabParamList = {
  Home: undefined;
  CommunityStack: undefined;
  Scan: undefined;
  Market: undefined;
  About: undefined;
};

export type ScanTabParamList = {
  Fruit: undefined;
  Leaf: undefined;
};

export type CommunityStackParamList = {
  Community: undefined;
  PostDetail: { postId: string };
  EditPost: { postId: string; title: string; content: string; category: string; imageUrl?: string };
};

export type RootStackParamList = {
  MainTabs: { screen?: string } | undefined;
  Notifications: undefined;
  LoginScreen:    { emailVerified?: boolean; message?: string; redirectTo?: string } | undefined;
  RegisterScreen: undefined;
  VerifyEmail: { token: string };
  Chatbot: undefined;
  About: undefined;       // ← AvocadoInfoScreen is registered here
  Profile: { initialTab?: 'personal' | 'address' | 'security' } | undefined;
  Admin: undefined;
  History: undefined;
  ProductDetail: { productId: string };
  Cart: undefined;
  ShippingScreen: undefined;
  ConfirmOrder: { shippingInfo: ShippingInfo; orderPricing?: OrderPricing };
  Payment: { shippingInfo: ShippingInfo; orderPricing: OrderPricing };
  OrderSuccess: undefined;
  ListOrders: undefined;
  OrderDetails: { id: string };
  ListReviews: undefined;
  CreateReview: { orderId: string; items: Array<{ productId: string; name: string; image: string; price: number }> };
};

export type CartScreenProps      = StackScreenProps<RootStackParamList, 'Cart'>;
export type ShippingScreenProps  = StackScreenProps<RootStackParamList, 'ShippingScreen'>;
export type ConfirmOrderProps    = StackScreenProps<RootStackParamList, 'ConfirmOrder'>;
export type PaymentScreenProps   = StackScreenProps<RootStackParamList, 'Payment'>;
export type OrderSuccessProps    = StackScreenProps<RootStackParamList, 'OrderSuccess'>;
export type ProductDetailProps   = StackScreenProps<RootStackParamList, 'ProductDetail'>;
export type OrderDetailsProps    = StackScreenProps<RootStackParamList, 'OrderDetails'>;

const Tab         = createBottomTabNavigator<TabParamList>();
const Stack       = createStackNavigator<RootStackParamList>();
const ScanTopTab  = createMaterialTopTabNavigator<ScanTabParamList>();
const CommunityStackNav = createStackNavigator<CommunityStackParamList>();

// ─────────────────────────────────────────────────────────────
// Scan tab navigator  (Fruit | Leaf)
// ─────────────────────────────────────────────────────────────

function ScanStackNavigator() {
  return (
    <ScanTopTab.Navigator
      screenOptions={{
        tabBarActiveTintColor  : '#4CAF50',
        tabBarInactiveTintColor: '#999',
        tabBarIndicatorStyle   : { backgroundColor: '#4CAF50', height: 3 },
        tabBarLabelStyle       : { fontSize: 14, fontWeight: '700', textTransform: 'none' },
        tabBarStyle            : { backgroundColor: '#fff', elevation: 2, shadowOpacity: 0.05 },
      }}
    >
      <ScanTopTab.Screen
        name="Fruit"
        component={FruitScanScreen}
        options={{
          tabBarLabel: 'Fruit',
          tabBarIcon : ({ color }) => <Ionicons name="nutrition-outline" size={18} color={color} />,
        }}
      />
      <ScanTopTab.Screen
        name="Leaf"
        component={LeafScanScreen}
        options={{
          tabBarLabel: 'Leaf',
          tabBarIcon : ({ color }) => <Ionicons name="leaf-outline" size={18} color={color} />,
        }}
      />
    </ScanTopTab.Navigator>
  );
}

// ─────────────────────────────────────────────────────────────
// Mobile menu modal
// ─────────────────────────────────────────────────────────────

function MobileMenuModal({
  visible, onClose, navigation,
}: { visible: boolean; onClose: () => void; navigation: any }) {
  const [screenWidth, setScreenWidth] = useState(getScreenWidth());
  const [user,        setUser]        = useState<any>(null);
  const slideAnim = useRef(new Animated.Value(-screenWidth * 0.75)).current;

  const allMenuItems = [
    { name: 'Home',      route: 'Home',           icon: 'home-outline'          },
    { name: 'Community', route: 'CommunityStack',  icon: 'people-outline'        },
    { name: 'Scan',      route: 'Scan',            icon: 'camera-outline', requiresAuth: true },
    { name: 'Market',    route: 'Market',          icon: 'storefront-outline'    },
    { name: 'About Avocado', route: 'About',       icon: 'leaf-outline'          },
  ];

  const menuItems = allMenuItems.filter(item => !item.requiresAuth || (item.requiresAuth && user));

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token    = (await AsyncStorage.getItem('jwt')) || (await AsyncStorage.getItem('token'));
        const userData = await AsyncStorage.getItem('user');
        if (token && userData) setUser(JSON.parse(userData)); else setUser(null);
      } catch { setUser(null); }
    };
    if (visible) loadUser();
  }, [visible]);

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setScreenWidth(window.width));
    return () => sub?.remove();
  }, []);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : -screenWidth * 0.75,
      duration: visible ? 300 : 250,
      useNativeDriver: false,
    }).start();
  }, [visible, screenWidth]);

  const handleNavigate = (route: string) => {
    const tabScreens = ['Home', 'CommunityStack', 'Scan', 'Market', 'About'];
    if (tabScreens.includes(route)) {
      const { CommonActions } = require('@react-navigation/native');
      navigation.dispatch(CommonActions.navigate({ name: 'MainTabs', params: { screen: route } }));
    } else {
      navigation.navigate(route);
    }
    onClose();
  };

  if (!visible) return null;
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <TouchableOpacity style={navStyles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <Animated.View style={[navStyles.modalContent, { transform: [{ translateX: slideAnim }] }]}>
          <TouchableOpacity activeOpacity={1} onPress={e => e.stopPropagation()} style={{ flex: 1 }}>
            <View style={navStyles.modalHeader}>
              <Text style={navStyles.modalTitle}>Menu</Text>
              <TouchableOpacity onPress={onClose} style={navStyles.modalCloseBtn}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView style={navStyles.modalBody}>
              {menuItems.map((item, idx) => (
                <TouchableOpacity key={idx} style={navStyles.modalMenuItem} onPress={() => handleNavigate(item.route)} activeOpacity={0.7}>
                  <Ionicons name={item.icon as any} size={22} color="#5d873e" />
                  <Text style={navStyles.modalMenuText}>{item.name}</Text>
                  <Ionicons name="chevron-forward" size={18} color="#999" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
// Custom header
// ─────────────────────────────────────────────────────────────

function CustomHeader({ navigation }: { navigation: any }) {
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);
  const [screenWidth, setScreenWidth] = useState(getScreenWidth());
  const isMobile = screenWidth < 768;

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
      if (window.width >= 768 && mobileMenuVisible) setMobileMenuVisible(false);
    });
    return () => sub?.remove();
  }, [mobileMenuVisible]);

  return (
    <>
      <Header onMenuPress={isMobile ? () => setMobileMenuVisible(true) : undefined} />
      {isMobile && (
        <MobileMenuModal
          visible={mobileMenuVisible}
          onClose={() => setMobileMenuVisible(false)}
          navigation={navigation}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Community stack
// ─────────────────────────────────────────────────────────────

function CommunityStackNavigator() {
  return (
    <CommunityStackNav.Navigator screenOptions={{ headerShown: false }}>
      <CommunityStackNav.Screen name="Community" component={CommunityScreen} />
      <CommunityStackNav.Screen name="PostDetail" component={PostDetailScreen} />
      <CommunityStackNav.Screen name="EditPost"   component={EditPostScreen} />
    </CommunityStackNav.Navigator>
  );
}

// ─────────────────────────────────────────────────────────────
// Shared layout constants
// ─────────────────────────────────────────────────────────────

const BOTTOM_NAV_HEIGHT = 65;

// ─────────────────────────────────────────────────────────────
// Floating chatbot wrapper
// Listens for OPEN_FLOATING_CHATBOT event from HomeScreen
// ─────────────────────────────────────────────────────────────

function FloatingChatbotWrapper() {
  const [user,          setUser]          = useState<any>(null);
  const [activeTabName, setActiveTabName] = useState('');
  const [forceOpen,     setForceOpen]     = useState(false);
  const [screenWidth,   setScreenWidth]   = useState(getScreenWidth());
  const isMobile = screenWidth < 768;

  let navTabName = '';
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    navTabName = useNavigationState(state => {
      if (!state?.routes || state.index == null) return '';
      return state.routes[state.index]?.name ?? '';
    }) ?? '';
  } catch { navTabName = ''; }

  useEffect(() => { setActiveTabName(navTabName); }, [navTabName]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token    = (await AsyncStorage.getItem('jwt')) || (await AsyncStorage.getItem('token'));
        const userData = await AsyncStorage.getItem('user');
        if (token && userData) setUser(JSON.parse(userData)); else setUser(null);
      } catch { setUser(null); }
    };
    loadUser();
  }, [activeTabName]);

  // Listen for open event emitted from HomeScreen Chatbot button
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('OPEN_FLOATING_CHATBOT', () => {
      setForceOpen(true);
      // Reset after a tick so FloatingChatbot can toggle normally after
      setTimeout(() => setForceOpen(false), 500);
    });
    return () => sub.remove();
  }, []);

  // Track screen width to compute bottom offset for the FAB
  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setScreenWidth(window.width));
    return () => sub?.remove();
  }, []);

  return <FloatingChatbot currentRoute={activeTabName} user={user} bottomOffset={isMobile ? BOTTOM_NAV_HEIGHT : 0} />;
}

// ─────────────────────────────────────────────────────────────
// Custom animated bottom tab bar  (mobile only)
// ─────────────────────────────────────────────────────────────

function CustomTabBar({ state, navigation }: any) {
  const [screenWidth, setScreenWidth] = useState(getScreenWidth());
  const [user, setUser] = useState<any>(null);
  const isMobile = screenWidth < 768;
  const insets = useSafeAreaInsets();

  // Load user to conditionally show Scan tab
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token    = (await AsyncStorage.getItem('jwt')) || (await AsyncStorage.getItem('token'));
        const userData = await AsyncStorage.getItem('user');
        if (token && userData) setUser(JSON.parse(userData)); else setUser(null);
      } catch { setUser(null); }
    };
    loadUser();
    // Web: listen for auth changes dispatched by Header/LoginScreen
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handler = () => loadUser();
      window.addEventListener('authChange', handler);
      return () => window.removeEventListener('authChange', handler);
    }
    // Native: listen via DeviceEventEmitter
    const sub = DeviceEventEmitter.addListener('authChange', () => loadUser());
    return () => sub.remove();
  // Re-check auth whenever active tab changes (covers login/logout redirects)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.index]);

  // per-tab bounce & active-scale animations
  const scaleAnims = useRef(state.routes.map(() => new Animated.Value(1))).current;
  const activeAnims = useRef(
    state.routes.map((_: any, i: number) => new Animated.Value(state.index === i ? 1 : 0))
  ).current;

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setScreenWidth(window.width));
    return () => sub?.remove();
  }, []);

  // Smooth transition when active tab changes
  useEffect(() => {
    state.routes.forEach((_: any, i: number) => {
      Animated.spring(activeAnims[i], {
        toValue: state.index === i ? 1 : 0,
        useNativeDriver: true,
        tension: 70,
        friction: 9,
      }).start();
    });
  }, [state.index]);

  if (!isMobile) return null;

  const handlePress = (route: any, index: number) => {
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!event.defaultPrevented) {
      // Bounce press animation
      Animated.sequence([
        Animated.spring(scaleAnims[index], { toValue: 0.82, useNativeDriver: true, tension: 130, friction: 6 }),
        Animated.spring(scaleAnims[index], { toValue: 1,    useNativeDriver: true, tension: 60,  friction: 7 }),
      ]).start();
      navigation.navigate({ name: route.name, merge: true });
    }
  };

  const getIcon = (routeName: string, focused: boolean): keyof typeof Ionicons.glyphMap => {
    switch (routeName) {
      case 'Home':           return focused ? 'home'       : 'home-outline';
      case 'CommunityStack': return focused ? 'people'     : 'people-outline';
      case 'Scan':           return 'camera';
      case 'Market':         return focused ? 'storefront' : 'storefront-outline';
      case 'About':          return focused ? 'leaf'       : 'leaf-outline';
      default:               return 'help-outline';
    }
  };

  const getLabel = (routeName: string) => {
    switch (routeName) {
      case 'Home':           return 'Home';
      case 'CommunityStack': return 'Community';
      case 'Scan':           return 'Scan';
      case 'Market':         return 'Market';
      case 'About':          return 'About';
      default:               return routeName;
    }
  };

  return (
    <View style={[bottomNavStyles.container, { paddingBottom: insets.bottom, height: BOTTOM_NAV_HEIGHT + insets.bottom }]}>
      {state.routes.map((route: any, index: number) => {
        const isFocused = state.index === index;
        const isCenter  = route.name === 'Scan';

        // Hide Scan tab entirely when not logged in
        if (isCenter && !user) return null;

        // Icon grows slightly when active
        const iconScale = activeAnims[index].interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });

        if (isCenter) {
          return (
            <TouchableOpacity
              key={route.key}
              style={bottomNavStyles.centerTabItem}
              onPress={() => handlePress(route, index)}
              activeOpacity={0.9}
            >
              <Animated.View
                style={[
                  bottomNavStyles.scanBtn,
                  isFocused && bottomNavStyles.scanBtnActive,
                  { transform: [{ scale: scaleAnims[index] }] },
                ]}
              >
                <Ionicons name="camera" size={30} color="#fff" />
              </Animated.View>
              <Text style={[bottomNavStyles.tabLabel, isFocused && bottomNavStyles.tabLabelActive]}>
                Scan
              </Text>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={route.key}
            style={bottomNavStyles.tabItem}
            onPress={() => handlePress(route, index)}
            activeOpacity={0.7}
          >
            <Animated.View
              style={{
                transform: [{ scale: Animated.multiply(scaleAnims[index], iconScale) }],
                alignItems: 'center',
              }}
            >
              {/* Active pill indicator */}
              <Animated.View
                style={[
                  bottomNavStyles.activeIndicator,
                  {
                    opacity: activeAnims[index],
                    transform: [{ scaleX: activeAnims[index] }],
                  },
                ]}
              />
              <Ionicons
                name={getIcon(route.name, isFocused)}
                size={23}
                color={isFocused ? '#5d873e' : '#aaa'}
              />
              <Text style={[bottomNavStyles.tabLabel, isFocused && bottomNavStyles.tabLabelActive]}>
                {getLabel(route.name)}
              </Text>
            </Animated.View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Main tab navigator  (Home | Community | Scan | Market | About)
// ─────────────────────────────────────────────────────────────

function MainTabNavigator() {
  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={({ route, navigation }) => ({
          header: () => <CustomHeader navigation={navigation} />,
          headerStyle: { elevation: 0, shadowOpacity: 0, borderBottomWidth: 0 },
          tabBarActiveTintColor  : '#7FA66D',
          tabBarInactiveTintColor: '#999',
          tabBarLabelStyle       : { fontSize: 11, fontWeight: '500', marginTop: 4 },
          tabBarItemStyle        : { paddingVertical: 5 },
        })}
      >
        <Tab.Screen name="Home"           component={HomeScreen}              options={{ title: 'Home',      tabBarLabel: 'Home'      }} />
        <Tab.Screen name="CommunityStack" component={CommunityStackNavigator} options={{ title: 'Community', tabBarLabel: 'Community' }} />
        <Tab.Screen name="Scan"           component={ScanStackNavigator}      options={{ title: 'Scan',      tabBarLabel: ''           }} />
        <Tab.Screen name="Market"         component={MarketScreen}            options={{ title: 'Market',    tabBarLabel: 'Market'    }} />
        <Tab.Screen name="About"          component={AboutScreen}             options={{ title: 'About',     tabBarLabel: 'About'     }} />
      </Tab.Navigator>
      <FloatingChatbotWrapper />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Root navigator
// ─────────────────────────────────────────────────────────────

export default function AppNavigator() {
  const [initialRoute, setInitialRoute] = useState<'MainTabs' | 'Admin'>('MainTabs');
  const [isReady,      setIsReady]      = useState(false);

  useEffect(() => { checkUserRole(); }, []);

  const checkUserRole = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.role === 'admin') setInitialRoute('Admin');
      }
    } catch { /* ignore */ } finally { setIsReady(true); }
  };

  if (!isReady) return null;

  const linking = {
    prefixes: ['avocare://', 'http://localhost:8081', 'https://avocare.app'],
    config: {
      screens: {
        MainTabs: {
          path: 'main',
          screens: {
            Home          : 'home',
            CommunityStack: 'community',
            Scan          : 'scan',
            Market        : 'market',
            About         : 'about-tab',
          },
        },
        VerifyEmail : { path: 'verify-email', parse: { token: (t: string) => t } },
        LoginScreen : { path: 'auth/login',   parse: { emailVerified: (v: string) => v === 'true', message: (m: string) => m } },
        RegisterScreen: { path: 'auth/register' },
        Chatbot     : 'chatbot',
        About       : 'about',       // ← AvocadoInfoScreen
        History     : 'history',
        Admin       : 'admin',
        Cart        : 'cart',
        ShippingScreen: 'checkout/shipping',
        ConfirmOrder  : 'checkout/confirm',
        Payment       : 'checkout/payment',
        OrderSuccess  : 'checkout/success',
        ListOrders    : 'orders',
        OrderDetails  : 'orders/:id',
        ListReviews   : 'reviews',
      },
    },
  };

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs"     component={MainTabNavigator} />
        <Stack.Screen name="LoginScreen"    component={LoginScreen}    options={{ presentation: 'modal' }} />
        <Stack.Screen name="RegisterScreen" component={RegisterScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="VerifyEmail"  component={VerifyEmailScreen} options={{ presentation: 'card', headerShown: false }} />
        <Stack.Screen name="Admin"        component={AdminNavigator}    options={{ presentation: 'card', headerShown: false }} />

        {/* Profile screen — accessible from header dropdown */}
        <Stack.Screen name="Profile" component={ProfileScreen} options={({ navigation }) => ({ presentation: 'card', headerShown: true, header: () => <CustomHeader navigation={navigation} /> })} />

        {/* About Avocado — now uses AvocadoInfoScreen */}
        <Stack.Screen
          name="About"
          component={AboutScreen}
          options={{ presentation: 'card', headerShown: false }}
        />

        <Stack.Screen name="History" component={HistoryScreen} options={({ navigation }) => ({ presentation: 'card', headerShown: true, header: () => <CustomHeader navigation={navigation} /> })} />
        <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={({ navigation }) => ({ presentation: 'card', headerShown: true, header: () => <CustomHeader navigation={navigation} /> })} />

        {/* Cart & checkout */}
        <Stack.Screen name="Cart"            component={Cart}                options={{ headerShown: false }} />
        <Stack.Screen name="ShippingScreen"  component={ShippingScreen}      options={{ headerShown: false }} />
        <Stack.Screen name="ConfirmOrder"    component={ConfirmOrderScreen}  options={{ headerShown: false }} />
        <Stack.Screen name="Payment"         component={PaymentScreen}       options={{ headerShown: false }} />
        <Stack.Screen name="OrderSuccess"    component={OrderSuccessScreen}  options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="ListOrders"      component={ListOrdersScreen}    options={{ headerShown: false }} />
        <Stack.Screen name="OrderDetails"    component={OrderDetails}        options={{ headerShown: false }} />
        <Stack.Screen name="ListReviews"     component={ListReviewsScreen}   options={{ headerShown: false }} />
        <Stack.Screen name="CreateReview"    component={CreateReviewScreen}  options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const navStyles = StyleSheet.create({
  scanButtonContainer: { position: 'absolute', top: -25, alignItems: 'center', justifyContent: 'center' },
  scanButton: { width: 65, height: 65, borderRadius: 32.5, backgroundColor: '#7FA66D', justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, borderWidth: 5, borderColor: '#ffffff' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', flexDirection: 'row' },
  modalContent: { backgroundColor: '#fff', width: '70%', maxWidth: 280, height: '100%', elevation: 10, shadowColor: '#000', shadowOffset: { width: 2, height: 0 }, shadowOpacity: 0.3, shadowRadius: 8 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, paddingTop: Platform.OS === 'ios' ? 50 : 24, borderBottomWidth: 1, borderBottomColor: '#e8f5e0', backgroundColor: '#5d873e' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
  modalCloseBtn: { padding: 4, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  modalBody: { flex: 1, paddingTop: 8 },
  modalMenuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f5f5f5', gap: 12 },
  modalMenuText: { flex: 1, fontSize: 15, color: '#2d5a3d', fontWeight: '600' },
});

// ── Bottom nav styles (mobile) ────────────────────────────────────────────────
const bottomNavStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e8f5e0',
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    zIndex: 100,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    paddingBottom: 2,
  },
  centerTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingBottom: 2,
  },
  scanBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#5d873e',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 12,
    shadowColor: '#2d6e10',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    borderWidth: 4,
    borderColor: '#fff',
    marginTop: -22,
  },
  scanBtnActive: {
    backgroundColor: '#4a7832',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#aaa',
    marginTop: 4,
  },
  tabLabelActive: {
    color: '#5d873e',
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    top: -8,
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#5d873e',
  },
});