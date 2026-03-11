import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Image,
  Dimensions,
  Alert,
  Platform,
  Animated,
} from 'react-native';
import { useNavigation, useFocusEffect, useNavigationState } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { styles } from '../Styles/Header.styles';
import Notifications from './Notifications';

const avocadoLogo = require('../assets/avocado.png');

// ─────────────────────────────────────────────────────────────────────────────
// Animated nav link — web hover + active underline + press scale
// ─────────────────────────────────────────────────────────────────────────────
interface NavLinkItemProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
}

const NavLinkItem: React.FC<NavLinkItemProps> = ({ label, isActive, onPress }) => {
  const hoverAnim  = useRef(new Animated.Value(0)).current; // drives bg + text tint
  const pressAnim  = useRef(new Animated.Value(1)).current; // drives scale
  const activeAnim = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(activeAnim, {
      toValue: isActive ? 1 : 0,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  }, [isActive]);

  const handleHoverIn = useCallback(() => {
    Animated.timing(hoverAnim, { toValue: 1, duration: 160, useNativeDriver: false }).start();
  }, []);

  const handleHoverOut = useCallback(() => {
    Animated.timing(hoverAnim, { toValue: 0, duration: 180, useNativeDriver: false }).start();
  }, []);

  const handlePressIn = useCallback(() => {
    Animated.spring(pressAnim, { toValue: 0.87, useNativeDriver: true, tension: 160, friction: 6 }).start();
  }, []);

  const handlePressOut = useCallback(() => {
    Animated.spring(pressAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 7 }).start();
  }, []);

  // Hover pill background (needs useNativeDriver:false for color)
  const bgColor = hoverAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(93,135,62,0)', 'rgba(93,135,62,0.10)'],
  });

  // Text color: isActive → deeper green, hover → lightly deeper, default → base
  const textColor = hoverAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [isActive ? '#3d6128' : '#5d873e', '#3d6128'],
  });

  // Underline scale & opacity driven by activeAnim (native driver OK)
  const underlineScale   = activeAnim;
  const underlineOpacity = activeAnim;

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={handleHoverIn}
      onHoverOut={handleHoverOut}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={{ alignItems: 'center' }}
    >
      <Animated.View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 8,
          backgroundColor: bgColor,
          transform: [{ scale: pressAnim }],
          alignItems: 'center',
        }}
      >
        <Animated.Text
          style={{
            fontSize: 13,
            fontWeight: '700',
            color: textColor,
            letterSpacing: 0.5,
          }}
        >
          {label}
        </Animated.Text>

        {/* Sliding active underline */}
        <Animated.View
          style={{
            height: 2.5,
            width: '75%',
            borderRadius: 2,
            backgroundColor: '#5d873e',
            marginTop: 3,
            transform: [{ scaleX: underlineScale }],
            opacity: underlineOpacity,
          }}
        />
      </Animated.View>
    </Pressable>
  );
};

const TAB_NAMES = ['Home', 'CommunityStack', 'Scan', 'Market', 'About'];

interface HeaderProps {
  onMenuPress?: () => void;
  showNavLinks?: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: string;
}

const Header: React.FC<HeaderProps> = ({ onMenuPress, showNavLinks = true }) => {
  const [user, setUser] = useState<User | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const navigation = useNavigation<any>();

  // Derive the active route from live navigation state so it always
  // reflects the current tab regardless of how navigation happened.

  const activeRoute = useNavigationState(state => {
    if (!state) return '';

    // Case 1: Header is rendered inside the Tab navigator — routes ARE the tabs
    if (state.index !== undefined && state.routes) {
      const active = state.routes[state.index]?.name ?? '';
      if (TAB_NAMES.includes(active)) return active;
    }

    // Case 2: Header is rendered inside the root Stack — find MainTabs nested state
    const mainTabs = state.routes?.find((r: any) => r.name === 'MainTabs');
    if (mainTabs?.state) {
      const tabState = mainTabs.state as any;
      return tabState.routes?.[tabState.index ?? 0]?.name ?? 'Home';
    }

    return '';
  }) || (() => {
    // Web URL fallback: parse the current pathname when navigation state is stale
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.includes('/community')) return 'CommunityStack';
      if (path.includes('/scan'))      return 'Scan';
      if (path.includes('/market'))    return 'Market';
      if (path.includes('/about-tab')) return 'About';
      if (path.includes('/home') || path === '/' || path.endsWith('/main')) return 'Home';
    }
    return 'Home';
  })();

  const isDesktop = screenWidth >= 768;

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });
    return () => subscription?.remove();
  }, []);

  const loadUser = async () => {
    try {
      const token =
        (await AsyncStorage.getItem('jwt')) || (await AsyncStorage.getItem('token'));
      const userData = await AsyncStorage.getItem('user');
      if (token && userData) {
        setUser(JSON.parse(userData));
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error loading user:', error);
      setUser(null);
    }
  };

  useEffect(() => {
    loadUser();
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleAuthChange = () => loadUser();
      window.addEventListener('authChange', handleAuthChange);
      return () => window.removeEventListener('authChange', handleAuthChange);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadUser();
    }, [])
  );

  const handleLogout = async () => {
    try {
      setDropdownOpen(false);
      await AsyncStorage.multiRemove([
        'token', 'jwt', 'user', 'userId', 'username', 'accessToken',
      ]);
      setUser(null);
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.dispatchEvent(new Event('authChange'));
      }
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs', state: { routes: [{ name: 'Home' }], index: 0 } }],
      });
      setTimeout(() => Alert.alert('Success', 'Logged out successfully'), 300);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const navigateTo = (screenName: string) => {
    if (screenName === 'Scan' && !user) {
      Alert.alert(
        'Login Required',
        'Please sign in to access the Scan feature.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => navigation.navigate('LoginScreen') },
        ]
      );
      return;
    }
    const tabScreens = ['Home', 'CommunityStack', 'Scan', 'Market', 'About'];
    if (tabScreens.includes(screenName)) {
      const { CommonActions } = require('@react-navigation/native');
      navigation.dispatch(
        CommonActions.navigate({ name: 'MainTabs', params: { screen: screenName } })
      );
    } else {
      navigation.navigate(screenName);
    }
  };

  const handleDropdownNavigate = (screenName: string) => {
    setDropdownOpen(false);
    navigateTo(screenName);
  };

  // ── Mobile: minimal top bar — notification + avatar only, no logo ─────────
  if (!isDesktop) {
    return (
      <View style={styles.mobileTopBar}>
        <View style={styles.mobileTopBarInner}>
          {user ? (
            <>
              <Notifications visible={true} />
              <View style={styles.userMenu}>
                <TouchableOpacity
                  onPress={() => setDropdownOpen(!dropdownOpen)}
                  style={styles.userButton}
                  activeOpacity={0.8}
                >
                  <View style={styles.userAvatarContainer}>
                    {user.image ? (
                      <Image source={{ uri: user.image }} style={styles.userImage} resizeMode="cover" />
                    ) : (
                      <View style={styles.defaultAvatar}>
                        <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
                      </View>
                    )}
                    <View style={styles.statusDot} />
                  </View>
                </TouchableOpacity>

                {dropdownOpen && (
                  <View style={styles.dropdownMenu}>
                    <View style={styles.dropdownHeader}>
                      <View style={styles.dropdownAvatarContainer}>
                        {user.image ? (
                          <Image source={{ uri: user.image }} style={styles.dropdownAvatar} resizeMode="cover" />
                        ) : (
                          <View style={styles.dropdownDefaultAvatar}>
                            <Text style={styles.dropdownAvatarText}>{user.name.charAt(0).toUpperCase()}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.userName}>{user.name}</Text>
                      <Text style={styles.userEmail}>{user.email}</Text>
                    </View>

                    <View style={styles.dropdownDivider} />

                    <TouchableOpacity style={styles.dropdownItem} onPress={() => handleDropdownNavigate('Profile')} activeOpacity={0.7}>
                      <View style={styles.dropdownIconContainer}><Ionicons name="person-outline" size={20} color="#5d873e" /></View>
                      <Text style={styles.dropdownText}>My Profile</Text>
                      <Ionicons name="chevron-forward" size={16} color="#999" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.dropdownItem} onPress={() => handleDropdownNavigate('ListOrders')} activeOpacity={0.7}>
                      <View style={styles.dropdownIconContainer}><Ionicons name="list-outline" size={20} color="#5d873e" /></View>
                      <Text style={styles.dropdownText}>My Orders</Text>
                      <Ionicons name="chevron-forward" size={16} color="#999" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.dropdownItem} onPress={() => handleDropdownNavigate('History')} activeOpacity={0.7}>
                      <View style={styles.dropdownIconContainer}><Ionicons name="time-outline" size={20} color="#5d873e" /></View>
                      <Text style={styles.dropdownText}>History</Text>
                      <Ionicons name="chevron-forward" size={16} color="#999" />
                    </TouchableOpacity>

                    <View style={styles.dropdownDivider} />

                    <TouchableOpacity style={[styles.dropdownItem, styles.logoutItem]} onPress={handleLogout} activeOpacity={0.7}>
                      <View style={[styles.dropdownIconContainer, styles.logoutIconContainer]}>
                        <Ionicons name="log-out-outline" size={20} color="#e74c3c" />
                      </View>
                      <Text style={[styles.dropdownText, styles.logoutText]}>Logout</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </>
          ) : (
            <TouchableOpacity style={styles.loginButton} onPress={() => navigateTo('LoginScreen')} activeOpacity={0.8}>
              <LinearGradient colors={['#90b481', '#7ba05b']} style={styles.loginButtonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Ionicons name="person-outline" size={16} color="#fff" />
                <Text style={styles.loginButtonText}>Sign In</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // ── Desktop: full header ──────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <View style={styles.gradientBackground}>
        <View style={styles.topHeader}>

          {/* Hamburger menu (mobile) */}
          {onMenuPress && (
            <TouchableOpacity
              style={styles.menuButton}
              onPress={onMenuPress}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconContainer}>
                <Ionicons name="menu" size={26} color="#5d873e" />
              </View>
            </TouchableOpacity>
          )}

          {/* Logo */}
          <TouchableOpacity
            style={styles.logoContainer}
            onPress={() => navigateTo('Home')}
            activeOpacity={0.8}
          >
            <View style={styles.logoWrapper}>
              <View style={styles.logoIconContainer}>
                <Image source={avocadoLogo} style={styles.avocadoImage} resizeMode="contain" />
              </View>
              <View style={styles.logoTextContainer}>
                <Text style={styles.logoText}>AvoCare</Text>
                <Text style={styles.logoSubtext}>Wellness & Growth</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Desktop nav links */}
          {isDesktop && showNavLinks && (
            <View style={styles.navLinks}>
              <NavLinkItem label="HOME"      isActive={activeRoute === 'Home'}          onPress={() => navigateTo('Home')} />
              <NavLinkItem label="COMMUNITY" isActive={activeRoute === 'CommunityStack'} onPress={() => navigateTo('CommunityStack')} />
              {user && (
                <NavLinkItem label="SCAN" isActive={activeRoute === 'Scan'} onPress={() => navigateTo('Scan')} />
              )}
              <NavLinkItem label="MARKET" isActive={activeRoute === 'Market'} onPress={() => navigateTo('Market')} />
              <NavLinkItem label="ABOUT"  isActive={activeRoute === 'About'}  onPress={() => navigateTo('About')} />
            </View>
          )}

          {/* ── Right-side actions ── */}
          <View style={styles.headerActions}>
            {user ? (
              /**
               * KEY FIX: Bell and avatar are siblings inside ONE flex row.
               * userMenu (position:relative) wraps ONLY the avatar so the
               * dropdown anchors correctly to the avatar, not to the bell.
               */
              <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 6 }}>

                {/* 🔔 Bell — visible only when logged in */}
                <Notifications visible={!!user} />

                {/* 👤 Avatar + profile dropdown */}
                <View style={styles.userMenu}>
                  <TouchableOpacity
                    onPress={() => setDropdownOpen(!dropdownOpen)}
                    style={styles.userButton}
                    activeOpacity={0.8}
                  >
                    <View style={styles.userAvatarContainer}>
                      {user.image ? (
                        <Image
                          source={{ uri: user.image }}
                          style={styles.userImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.defaultAvatar}>
                          <Text style={styles.avatarText}>
                            {user.name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={styles.statusDot} />
                    </View>
                  </TouchableOpacity>

                  {dropdownOpen && (
                    <View style={styles.dropdownMenu}>
                      <View style={styles.dropdownHeader}>
                        <View style={styles.dropdownAvatarContainer}>
                          {user.image ? (
                            <Image
                              source={{ uri: user.image }}
                              style={styles.dropdownAvatar}
                              resizeMode="cover"
                            />
                          ) : (
                            <View style={styles.dropdownDefaultAvatar}>
                              <Text style={styles.dropdownAvatarText}>
                                {user.name.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.userName}>{user.name}</Text>
                        <Text style={styles.userEmail}>{user.email}</Text>
                      </View>

                      <View style={styles.dropdownDivider} />

                      <TouchableOpacity
                        style={styles.dropdownItem}
                        onPress={() => handleDropdownNavigate('Profile')}
                        activeOpacity={0.7}
                      >
                        <View style={styles.dropdownIconContainer}>
                          <Ionicons name="person-outline" size={20} color="#5d873e" />
                        </View>
                        <Text style={styles.dropdownText}>My Profile</Text>
                        <Ionicons name="chevron-forward" size={16} color="#999" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.dropdownItem}
                        onPress={() => handleDropdownNavigate('ListOrders')}
                        activeOpacity={0.7}
                      >
                        <View style={styles.dropdownIconContainer}>
                          <Ionicons name="list-outline" size={20} color="#5d873e" />
                        </View>
                        <Text style={styles.dropdownText}>My Orders</Text>
                        <Ionicons name="chevron-forward" size={16} color="#999" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.dropdownItem}
                        onPress={() => handleDropdownNavigate('History')}
                        activeOpacity={0.7}
                      >
                        <View style={styles.dropdownIconContainer}>
                          <Ionicons name="time-outline" size={20} color="#5d873e" />
                        </View>
                        <Text style={styles.dropdownText}>History</Text>
                        <Ionicons name="chevron-forward" size={16} color="#999" />
                      </TouchableOpacity>

                      <View style={styles.dropdownDivider} />

                      <TouchableOpacity
                        style={[styles.dropdownItem, styles.logoutItem]}
                        onPress={handleLogout}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.dropdownIconContainer, styles.logoutIconContainer]}>
                          <Ionicons name="log-out-outline" size={20} color="#e74c3c" />
                        </View>
                        <Text style={[styles.dropdownText, styles.logoutText]}>Logout</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
                {/* end avatar + dropdown */}

              </View>
              /* end bell + avatar row */

            ) : (
              <TouchableOpacity
                style={styles.loginButton}
                onPress={() => navigateTo('LoginScreen')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#90b481', '#7ba05b']}
                  style={styles.loginButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="person-outline" size={16} color="#fff" />
                  <Text style={styles.loginButtonText}>Sign In</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

        </View>
      </View>
    </View>
  );
};

export default Header;