import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';

type RootStackParamList = {
  About: undefined;
  MainTabs: { screen?: string } | undefined;
};
type NavigationProp = StackNavigationProp<RootStackParamList, 'About'>;
interface Props { navigation: NavigationProp; }

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  darkForest:   '#1a3d0a',
  forest:       '#2d5016',
  sage:         '#3d6b22',
  sageMed:      '#5a8c35',
  sagePale:     '#d4ecb8',
  sageMid:      '#b0d890',
  sageTint:     '#e4f5d0',
  // Page background — noticeably green
  pageBg:       '#cce8a8',
  // Section stripe alternate
  altBg:        '#bedd96',
  // Cards — light green tint, not white
  cardBg:       '#f0f9e4',
  cardBgAlt:    '#e8f5d4',
  border:       '#b8d898',
  borderSoft:   '#cce0a8',
  ink:          '#111a0a',
  inkSoft:      '#2e4420',
  inkFaint:     '#5a7840',
  bodyText:     '#2e4020',
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const heroStats = [
  { value: '3rd',      label: 'Largest Producer\nin SE Asia', icon: '🏆' },
  { value: '28K+',     label: 'Hectares\nCultivated',         icon: '🌾' },
  { value: '₱80–120',  label: 'Farm Gate\nPrice/kg',          icon: '💰' },
  { value: 'Jun–Oct',  label: 'Peak Harvest\nSeason',         icon: '📅' },
];

const regions = [
  { name: 'Batangas', province: 'CALABARZON',      note: 'Top producer, known for large Fuerte-type fruits',             icon: '🥑', color: '#2d5a1b' },
  { name: 'Benguet',  province: 'Cordillera',      note: 'High-altitude farms produce firm, long-shelf-life avocados',   icon: '⛰️', color: '#4a7c35' },
  { name: 'Bohol',    province: 'Central Visayas', note: 'Growing export hub with organic farming practices',            icon: '🌿', color: '#5d873e' },
  { name: 'Laguna',   province: 'CALABARZON',      note: 'Near Manila market with fast distribution advantage',          icon: '🚛', color: '#6b9e4a' },
  { name: 'Palawan',  province: 'MIMAROPA',        note: 'Emerging region with rich volcanic soil',                      icon: '🌺', color: '#90b481' },
  { name: 'Bulacan',  province: 'Central Luzon',   note: 'Major supplier to Metro Manila wet markets',                   icon: '🏙️', color: '#3d6e2a' },
];

const varieties = [
  { name: 'Fuerte',  tag: 'Most Common',   tagColor: '#2d5a1b', description: 'The dominant variety in the Philippines. Pear-shaped with smooth green skin, creamy pale-yellow flesh, and a mild buttery flavor. Thrives in Batangas and Laguna.', season: 'Jun – Sep', weight: '200–400g', flavor: 'Mild & Buttery' },
  { name: 'Hass',    tag: 'Export Grade',  tagColor: '#c0392b', description: 'Increasingly grown for export markets. Pebbly dark skin turns purplish-black when ripe. Richer flavor and higher oil content than Fuerte. Preferred by Japanese buyers.', season: 'Jul – Oct', weight: '150–300g', flavor: 'Rich & Nutty' },
  { name: 'Lula',    tag: 'Local Variety', tagColor: '#e67e22', description: 'A Philippine-adapted variety beloved by Visayans. Large, round fruit with high water content. Commonly served as a shake or dessert. Very popular in Bohol and Cebu.', season: 'May – Aug', weight: '300–600g', flavor: 'Sweet & Mild' },
  { name: 'Pollock', tag: 'Backyard Grown',tagColor: '#8e44ad', description: 'A large green variety often grown in home gardens. Elongated shape, fiber-free flesh. Tolerates Philippine lowland heat well. Sold in local palengkes across Luzon.', season: 'Jun – Oct', weight: '400–800g', flavor: 'Light & Watery' },
];

const phillyCulture = [
  { icon: '🥤', title: 'Avocado Shake',        description: 'The most beloved Filipino preparation — ripe avocado blended with evaporated milk, sugar, and ice. A staple in carinderia menus from Ilocos to Mindanao.' },
  { icon: '🍨', title: 'Avocado Ice Cream',    description: 'Served in Filipino dessert shops and halo-halo variants. The natural creaminess of local varieties makes it perfect for frozen desserts.' },
  { icon: '🍚', title: 'With Rice & Bagoong',  description: 'A savory Batangas tradition — sliced avocado paired with hot sinangag and fermented shrimp paste. The fat in avocado perfectly balances the saltiness of bagoong.' },
  { icon: '🌮', title: 'Ensalada',              description: 'Mixed with tomato, onion, and patis as a fresh side salad. A lighter Filipino take on guacamole, often served alongside fried fish or grilled liempo.' },
];

const challenges = [
  { icon: '🌧️', title: 'Post-Harvest Losses',      desc: 'Up to 30% of harvests lost due to lack of cold storage and poor farm-to-market road infrastructure.' },
  { icon: '🦠', title: 'Phytophthora Root Rot',    desc: 'Most destructive disease in Philippine avocado farms. Caused by waterlogged soil during typhoon season.' },
  { icon: '📉', title: 'Price Volatility',          desc: 'Glut during peak season drops prices to ₱20/kg, while off-season retail prices spike to ₱150+/kg.' },
  { icon: '🌀', title: 'Typhoon Damage',            desc: 'Avocado trees are susceptible to wind damage. Typhoon season overlaps with harvest causing significant losses.' },
];

const opportunities = [
  { icon: '🇯🇵', text: 'Japan & South Korea demand premium Philippine avocados' },
  { icon: '🫙',  text: 'Avocado oil processing — emerging cottage industry in Batangas' },
  { icon: '💄',  text: 'Cosmetics & skincare using avocado seed and oil extract' },
  { icon: '🌱',  text: 'DA Organic Certification Program driving export premiums' },
  { icon: '📱',  text: 'AgriTech platforms connecting farmers directly to buyers' },
];

const nutrients = [
  { name: 'Healthy Fat', value: 15, max: 20, unit: 'g',   color: '#2d5a1b' },
  { name: 'Fiber',       value: 7,  max: 10, unit: 'g',   color: '#5d873e' },
  { name: 'Potassium',   value: 485,max: 600,unit: 'mg',  color: '#90b481' },
  { name: 'Folate',      value: 81, max: 100,unit: 'mcg', color: '#b5d49c' },
  { name: 'Vitamin C',   value: 10, max: 30, unit: 'mg',  color: '#6b9e4a' },
  { name: 'Vitamin E',   value: 2.1,max: 5,  unit: 'mg',  color: '#4a7c35' },
];

// ─── Animated Section ─────────────────────────────────────────────────────────

const AnimatedSection: React.FC<{ children: React.ReactNode; delay?: number; style?: any }> = ({
  children, delay = 0, style,
}) => {
  const fade  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(28)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade,  { toValue: 1, duration: 650, delay, useNativeDriver: true }),
      Animated.spring(slide, { toValue: 0, friction: 8, tension: 45, delay, useNativeDriver: true } as any),
    ]).start();
  }, []);

  return (
    <Animated.View style={[{ opacity: fade, transform: [{ translateY: slide }] }, style]}>
      {children}
    </Animated.View>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const AvocadoInfoScreen: React.FC<Props> = ({ navigation }) => {
  const [windowWidth, setWindowWidth] = useState(Dimensions.get('window').width);
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setWindowWidth(window.width));
    return () => sub?.remove();
  }, []);

  const isWide        = windowWidth >= 768;
  const contentMaxWidth = 880;

  const SectionTitle = ({ emoji, title, subtitle }: { emoji: string; title: string; subtitle?: string }) => (
    <View style={s.titleBlock}>
      <Text style={s.titleEmoji}>{emoji}</Text>
      <Text style={s.titleText}>{title}</Text>
      {subtitle ? <Text style={s.titleSub}>{subtitle}</Text> : null}
      <View style={s.titleBar} />
    </View>
  );

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.darkForest} />

      <Animated.ScrollView
        style={[
          { flex: 1, backgroundColor: C.pageBg },
          Platform.OS === 'web' && ({
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch',
            minHeight: 0,
          } as any),
        ]}
        contentContainerStyle={[
          { paddingBottom: 60, backgroundColor: C.pageBg },
          isWide && { alignItems: 'center' },
        ]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        {/* ── HERO ── */}
        <LinearGradient colors={['#1a3d0a', '#2d5a1b', '#4a7c35']} style={[s.hero, isWide && { width: '100%' }]}>
          <View style={[s.heroBubble, { width: 300, height: 300, top: -100, right: -80 }]} />
          <View style={[s.heroBubble, { width: 180, height: 180, bottom: -40, left: -50 }]} />

          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>

          <AnimatedSection delay={0}>
            <Text style={s.heroEyebrow}>🇵🇭  THE PHILIPPINE GUIDE</Text>
            <Text style={s.heroTitle}>Avocado{'\n'}Farming</Text>
            <Text style={s.heroSub}>
              From Batangas orchards to global markets — the complete guide to the Philippines' most prized fruit crop.
            </Text>
          </AnimatedSection>
        </LinearGradient>

        <View style={[s.page, isWide && { width: contentMaxWidth, maxWidth: '100%' }]}>

          {/* STATS */}
          <AnimatedSection delay={60} style={s.sec}>
            <SectionTitle emoji="📊" title="By the Numbers" subtitle="Philippine avocado industry at a glance" />
            <View style={[s.statsRow, isWide && { flexWrap: 'nowrap' }]}>
              {heroStats.map((stat, i) => (
                <AnimatedSection key={i} delay={120 + i * 80}
                  style={[s.statCard, isWide ? { flex: 1 } : { width: (windowWidth - 52) / 2 }]}>
                  <Text style={s.statIcon}>{stat.icon}</Text>
                  <Text style={s.statVal}>{stat.value}</Text>
                  <Text style={s.statLbl}>{stat.label}</Text>
                </AnimatedSection>
              ))}
            </View>
          </AnimatedSection>

          <View style={s.divRow}>
            <View style={s.divLine} /><Text style={s.divEmoji}>🥑</Text><View style={s.divLine} />
          </View>

          {/* OVERVIEW */}
          <AnimatedSection delay={0} style={s.sec}>
            <SectionTitle emoji="🌏" title="Avocado in the Philippines" subtitle="A crop with deep roots and growing promise" />
            <View style={s.card}>
              <Text style={s.bodyTxt}>
                The avocado (<Text style={{ fontStyle: 'italic' }}>Persea americana</Text>) has been cultivated in the Philippines since the Spanish colonial period, arriving from Mexico in the 17th century. Today it is one of the most commercially significant fruit crops in the country, with over 28,000 hectares under cultivation across Luzon and the Visayas.
              </Text>
              <Text style={[s.bodyTxt, { marginTop: 10 }]}>
                The DA actively promotes avocado as a high-value crop under the HVCDP. With rising domestic consumption and growing export demand from Japan, South Korea, and the Middle East, Philippine avocado is increasingly seen as a major agricultural growth driver.
              </Text>
              <View style={s.highlight}>
                <Ionicons name="trending-up" size={18} color={C.sage} />
                <Text style={s.highlightText}>
                  Production volume has grown 18% over the last 5 years, driven by DA subsidies and farmer cooperatives.
                </Text>
              </View>
            </View>
          </AnimatedSection>

          {/* VARIETIES */}
          <AnimatedSection delay={0} style={s.sec}>
            <SectionTitle emoji="🌿" title="Philippine Varieties" subtitle="The four key types grown across the archipelago" />
            <View style={isWide ? s.grid2 : s.stackCol}>
              {varieties.map((v, i) => (
                <AnimatedSection key={i} delay={80 + i * 100}
                  style={isWide ? s.halfCard : s.card}>
                  <View style={s.varHead}>
                    <Text style={s.varName}>{v.name}</Text>
                    <View style={[s.varTag, { backgroundColor: v.tagColor + '20', borderColor: v.tagColor + '50' }]}>
                      <Text style={[s.varTagTxt, { color: v.tagColor }]}>{v.tag}</Text>
                    </View>
                  </View>
                  <Text style={s.bodyTxt}>{v.description}</Text>
                  <View style={s.varMeta}>
                    {[
                      { icon: 'calendar-outline',   val: v.season },
                      { icon: 'scale-outline',       val: v.weight },
                      { icon: 'restaurant-outline',  val: v.flavor },
                    ].map((m, mi) => (
                      <View key={mi} style={s.metaChip}>
                        <Ionicons name={m.icon as any} size={12} color={C.sage} />
                        <Text style={s.metaTxt}>{m.val}</Text>
                      </View>
                    ))}
                  </View>
                </AnimatedSection>
              ))}
            </View>
          </AnimatedSection>

          {/* REGIONS */}
          <AnimatedSection delay={0} style={s.sec}>
            <SectionTitle emoji="📍" title="Major Growing Regions" subtitle="Where Philippine avocados come from" />
            <View style={[s.regGrid, isWide && s.regGridWide]}>
              {regions.map((r, i) => (
                <AnimatedSection key={i} delay={60 + i * 80}
                  style={[s.regCard, { borderTopColor: r.color },
                    isWide ? { width: '31%' } : { width: (windowWidth - 52) / 2 }]}>
                  <Text style={s.regIcon}>{r.icon}</Text>
                  <Text style={s.regName}>{r.name}</Text>
                  <Text style={s.regProv}>{r.province}</Text>
                  <Text style={s.regNote}>{r.note}</Text>
                </AnimatedSection>
              ))}
            </View>
          </AnimatedSection>

          <View style={s.divRow}>
            <View style={s.divLine} /><Text style={s.divEmoji}>🇵🇭</Text><View style={s.divLine} />
          </View>

          {/* CULINARY CULTURE */}
          <AnimatedSection delay={0} style={s.sec}>
            <SectionTitle emoji="🍽️" title="Filipino Avocado Culture" subtitle="How Filipinos enjoy their avocado" />
            <View style={isWide ? s.grid2 : s.stackCol}>
              {phillyCulture.map((item, i) => (
                <AnimatedSection key={i} delay={80 + i * 100}
                  style={isWide ? s.halfCard : undefined}>
                  <LinearGradient colors={[C.sageTint, C.sagePale]} style={s.cultureCard}>
                    <Text style={s.cultureIcon}>{item.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={s.cultureTitle}>{item.title}</Text>
                      <Text style={s.bodyTxt}>{item.description}</Text>
                    </View>
                  </LinearGradient>
                </AnimatedSection>
              ))}
            </View>
          </AnimatedSection>

          {/* NUTRITION */}
          <AnimatedSection delay={0} style={s.sec}>
            <SectionTitle emoji="💚" title="Nutritional Value" subtitle="Per 100g of fresh Philippine avocado" />
            <View style={s.card}>
              {nutrients.map((n, i) => (
                <AnimatedSection key={i} delay={i * 70}>
                  <View style={s.nutriRow}>
                    <Text style={s.nutriName}>{n.name}</Text>
                    <View style={s.nutriBg}>
                      <View style={[s.nutriFill, { width: `${(n.value / n.max) * 100}%` as any, backgroundColor: n.color }]} />
                    </View>
                    <Text style={s.nutriVal}>{n.value}{n.unit}</Text>
                  </View>
                </AnimatedSection>
              ))}
              <View style={s.nutriNote}>
                <Ionicons name="information-circle-outline" size={14} color={C.sage} />
                <Text style={s.nutriNoteText}>
                  Philippine avocados have slightly higher water content than Hass due to tropical growing conditions.
                </Text>
              </View>
            </View>
          </AnimatedSection>

          {/* GROWING GUIDE */}
          <AnimatedSection delay={0} style={s.sec}>
            <SectionTitle emoji="🌱" title="Growing in the Philippines" subtitle="Climate, soil & best practices for PH conditions" />
            <View style={s.card}>
              {[
                { icon: '🌡️', label: 'Ideal Temperature', value: '20–30°C (highland elevations preferred for fruit quality)' },
                { icon: '🌧️', label: 'Rainfall',          value: '1,000–2,000mm/year; avoid waterlogging during typhoon season' },
                { icon: '🪨',  label: 'Soil Type',         value: 'Well-draining loam or clay-loam, pH 5.5–7.0' },
                { icon: '☀️',  label: 'Sunlight',          value: 'Full sun, minimum 6 hours daily exposure' },
                { icon: '🌳',  label: 'Tree Spacing',      value: '8–10 meters apart; allows intercropping with banana or cacao' },
                { icon: '⏳',  label: 'First Harvest',     value: '3–4 years (grafted seedling), 5–7 years (from seed)' },
                { icon: '🪣',  label: 'Irrigation',        value: 'Critical during dry season (Mar–May); drip irrigation recommended' },
                { icon: '🔬',  label: 'Fertilization',     value: 'Apply NPK at planting; foliar feeding during flowering stage' },
              ].map((item, i) => (
                <AnimatedSection key={i} delay={i * 50}>
                  <View style={[s.growRow, i === 7 && { borderBottomWidth: 0 }]}>
                    <Text style={s.growIcon}>{item.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={s.growLabel}>{item.label}</Text>
                      <Text style={s.growValue}>{item.value}</Text>
                    </View>
                  </View>
                </AnimatedSection>
              ))}
            </View>
          </AnimatedSection>

          {/* CHALLENGES */}
          <AnimatedSection delay={0} style={s.sec}>
            <SectionTitle emoji="⚠️" title="Challenges Facing Farmers" subtitle="Key issues in Philippine avocado production" />
            <View style={isWide ? s.grid2 : s.stackCol}>
              {challenges.map((c, i) => (
                <AnimatedSection key={i} delay={80 + i * 90}
                  style={isWide ? s.halfCard : undefined}>
                  <View style={s.challengeCard}>
                    <Text style={s.challengeIcon}>{c.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={s.challengeTitle}>{c.title}</Text>
                      <Text style={s.bodyTxt}>{c.desc}</Text>
                    </View>
                  </View>
                </AnimatedSection>
              ))}
            </View>
          </AnimatedSection>

          {/* OPPORTUNITIES */}
          <AnimatedSection delay={0} style={s.sec}>
            <SectionTitle emoji="🚀" title="Growth Opportunities" subtitle="Why Philippine avocado has a bright future" />
            <LinearGradient colors={['#1a3d0a', '#2d5a1b']} style={s.oppCard}>
              {opportunities.map((o, i) => (
                <AnimatedSection key={i} delay={60 + i * 70}>
                  <View style={[s.oppRow, i === opportunities.length - 1 && { borderBottomWidth: 0 }]}>
                    <Text style={s.oppIcon}>{o.icon}</Text>
                    <Text style={s.oppText}>{o.text}</Text>
                  </View>
                </AnimatedSection>
              ))}
            </LinearGradient>
          </AnimatedSection>

          {/* DID YOU KNOW */}
          <AnimatedSection delay={0} style={s.sec}>
            <LinearGradient colors={[C.sageTint, C.sagePale]} style={s.dykCard}>
              <Text style={s.dykEmoji}>💡</Text>
              <Text style={s.dykTitle}>Did You Know?</Text>
              <Text style={s.bodyTxt}>
                Filipinos consume avocado almost exclusively as a sweet dessert — a sharp contrast to most of the world. The classic avocado shake (blended with condensed milk and ice) is a street food icon, with dedicated stalls found in public markets from Batangas City to Tagbilaran.
              </Text>
              <View style={s.dykDivider} />
              <Text style={s.bodyTxt}>
                The Philippines exports avocados primarily to Japan, where Philippine Fuerte-type fruits are prized for their mild flavor and larger size. The growing Korean Wave of avocado cuisine has also opened new export corridors to South Korea.
              </Text>
            </LinearGradient>
          </AnimatedSection>

          {/* CTA */}
          <AnimatedSection delay={0} style={[s.sec, { marginBottom: 20 }]}>
            <LinearGradient colors={['#1a3d0a', '#4a7c35']} style={s.ctaCard}>
              <Text style={s.ctaTitle}>Start Caring for Your Avocado</Text>
              <Text style={s.ctaSub}>
                Use AvoCare's scan and analytics tools to monitor your trees, detect pests early, and connect with fellow Filipino avocado farmers.
              </Text>
              <TouchableOpacity
                style={s.ctaBtn}
                onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
                activeOpacity={0.85}
              >
                <Text style={s.ctaBtnTxt}>Explore AvoCare Tools</Text>
                <Ionicons name="arrow-forward" size={15} color="#1a3d0a" />
              </TouchableOpacity>
            </LinearGradient>
          </AnimatedSection>

        </View>
      </Animated.ScrollView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1a3d0a',
    ...(Platform.OS === 'web'
      ? ({ height: '100vh', maxHeight: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' } as any)
      : {}),
  },

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero: {
    paddingTop: Platform.OS === 'ios' ? 58 : Platform.OS === 'android' ? 42 : 28,
    paddingBottom: 44,
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  heroBubble: {
    position: 'absolute',
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 22,
  },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 52,
    fontWeight: '900',
    color: '#fff',
    lineHeight: 56,
    letterSpacing: -1.5,
    marginBottom: 14,
  },
  heroSub: {
    fontSize: 15,             // bumped from 13
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 23,
    maxWidth: 460,
  },

  // ── Page ──────────────────────────────────────────────────────────────────
  page:     { width: '100%', alignSelf: 'center' },
  sec:      { paddingHorizontal: 20, paddingTop: 30 },

  // ── Section title ─────────────────────────────────────────────────────────
  titleBlock: { marginBottom: 18 },
  titleEmoji: { fontSize: 28, marginBottom: 4 },     // bumped from 26
  titleText:  {
    fontSize: 23,                                      // bumped from 21
    fontWeight: '800',
    color: '#1a3d0a',
    letterSpacing: -0.4,
    marginBottom: 3,
  },
  titleSub:   { fontSize: 14, color: '#5a7840', marginBottom: 6 },  // bumped from 12, greener
  titleBar:   { width: 36, height: 3, backgroundColor: '#5d873e', borderRadius: 2 },

  // ── Divider ───────────────────────────────────────────────────────────────
  divRow:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 24, gap: 12 },
  divLine: { flex: 1, height: 1, backgroundColor: '#b0d890' },      // deeper green line
  divEmoji:{ fontSize: 18 },

  // ── Stats ─────────────────────────────────────────────────────────────────
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    backgroundColor: '#e8f5d4',                        // green tint, not white
    borderRadius: 14, padding: 14, alignItems: 'center',
    borderWidth: 1, borderColor: '#b8d898',
    elevation: 2,
    shadowColor: '#2d5a1b', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6,
  },
  statIcon: { fontSize: 24, marginBottom: 5 },
  statVal:  { fontSize: 22, fontWeight: '900', color: '#1a3d0a', marginBottom: 2 },  // bumped
  statLbl:  { fontSize: 12, color: '#5a7840', textAlign: 'center', lineHeight: 16 }, // bumped + greener

  // ── Card ──────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: '#e8f5d4',                        // green tint, not white
    borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: '#b8d898',
    elevation: 2,
    shadowColor: '#2d5a1b', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6,
  },
  bodyTxt:      { fontSize: 14, color: '#2e4020', lineHeight: 23 },  // bumped from 13, darker green
  highlight: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#d4ecb8',                        // deeper highlight
    borderRadius: 10, padding: 12, marginTop: 12,
    borderLeftWidth: 3, borderLeftColor: '#3d6b22',
  },
  highlightText: { flex: 1, fontSize: 14, color: '#2d5016', fontWeight: '600', lineHeight: 21 },

  // ── Grid layouts ──────────────────────────────────────────────────────────
  grid2:    { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  stackCol: { gap: 12 },
  halfCard: {
    width: '48%',
    backgroundColor: '#e8f5d4',                        // green tint
    borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#b8d898',
    elevation: 2,
    shadowColor: '#2d5a1b', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4,
  },

  // ── Varieties ─────────────────────────────────────────────────────────────
  varHead:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  varName:   { fontSize: 17, fontWeight: '800', color: '#1a3d0a' },  // bumped from 16
  varTag:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  varTagTxt: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  varMeta:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  metaChip:  { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#d4ecb8', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  metaTxt:   { fontSize: 11, color: '#3d6b22', fontWeight: '600' },  // bumped from 10

  // ── Regions ───────────────────────────────────────────────────────────────
  regGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  regGridWide: { justifyContent: 'space-between' },
  regCard: {
    backgroundColor: '#e8f5d4',                        // green tint
    borderRadius: 12, padding: 14,
    borderTopWidth: 3, borderWidth: 1, borderColor: '#b8d898',
    elevation: 1,
    shadowColor: '#2d5a1b', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3,
  },
  regIcon: { fontSize: 22, marginBottom: 4 },
  regName: { fontSize: 15, fontWeight: '800', color: '#1a3d0a', marginBottom: 2 },  // bumped from 14
  regProv: { fontSize: 10, color: '#3d6b22', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5 },
  regNote: { fontSize: 12, color: '#3a5020', lineHeight: 17 },       // bumped from 11, darker

  // ── Culture cards ─────────────────────────────────────────────────────────
  cultureCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#b0d890',
  },
  cultureIcon:  { fontSize: 32, marginTop: 2 },
  cultureTitle: { fontSize: 15, fontWeight: '800', color: '#1a3d0a', marginBottom: 4 },  // bumped from 14

  // ── Nutrition ─────────────────────────────────────────────────────────────
  nutriRow:      { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  nutriName:     { width: 92, fontSize: 12, color: '#2e4020', fontWeight: '600' },  // bumped from 11
  nutriBg:       { flex: 1, height: 11, backgroundColor: '#cce0a8', borderRadius: 5, overflow: 'hidden' },
  nutriFill:     { height: '100%', borderRadius: 5 },
  nutriVal:      { width: 54, fontSize: 12, color: '#1a3d0a', fontWeight: '700', textAlign: 'right' },
  nutriNote:     { flexDirection: 'row', alignItems: 'flex-start', gap: 5, marginTop: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#c8e0a8' },
  nutriNoteText: { flex: 1, fontSize: 12, color: '#5a7840', lineHeight: 17, fontStyle: 'italic' },  // bumped

  // ── Growing guide ─────────────────────────────────────────────────────────
  growRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#cce0a8' },
  growIcon:  { fontSize: 20, width: 26, textAlign: 'center', marginTop: 1 },
  growLabel: { fontSize: 13, fontWeight: '700', color: '#1a3d0a', marginBottom: 2 },  // bumped from 12
  growValue: { fontSize: 13, color: '#2e4020', lineHeight: 19, maxWidth: 300 },       // bumped from 12

  // ── Challenges ────────────────────────────────────────────────────────────
  challengeCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: '#fdf5ee',
    borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#ffe0cc',
    borderLeftWidth: 4, borderLeftColor: '#e67e22',
    elevation: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3,
  },
  challengeIcon:  { fontSize: 26, marginTop: 1 },
  challengeTitle: { fontSize: 14, fontWeight: '800', color: '#c0392b', marginBottom: 3 },  // bumped from 13

  // ── Opportunities ─────────────────────────────────────────────────────────
  oppCard: { borderRadius: 16, padding: 18 },
  oppRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  oppIcon: { fontSize: 22, width: 28, textAlign: 'center' },
  oppText: { flex: 1, fontSize: 14, color: '#c8edaa', lineHeight: 20, fontWeight: '500' },  // bumped from 13

  // ── Did You Know ──────────────────────────────────────────────────────────
  dykCard:    { borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#b0d890' },
  dykEmoji:   { fontSize: 32, marginBottom: 6 },
  dykTitle:   { fontSize: 18, fontWeight: '800', color: '#1a3d0a', marginBottom: 10 },  // bumped from 17
  dykDivider: { height: 1, backgroundColor: '#b8d898', marginVertical: 14 },

  // ── CTA ───────────────────────────────────────────────────────────────────
  ctaCard:   { borderRadius: 20, padding: 28, alignItems: 'center' },
  ctaTitle:  { fontSize: 22, fontWeight: '900', color: '#fff', textAlign: 'center', marginBottom: 10, letterSpacing: -0.3 },  // bumped from 20
  ctaSub:    { fontSize: 14, color: 'rgba(255,255,255,0.82)', textAlign: 'center', lineHeight: 22, marginBottom: 20, maxWidth: 380 },
  ctaBtn:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#c8edaa', paddingVertical: 13, paddingHorizontal: 24, borderRadius: 50 },
  ctaBtnTxt: { fontSize: 14, fontWeight: '800', color: '#1a3d0a', letterSpacing: 0.3 },
});

export default AvocadoInfoScreen;