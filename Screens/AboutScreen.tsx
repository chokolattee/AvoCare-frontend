import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import Footer from '../Components/Footer';
import { styles } from '../Styles/AboutScreen.styles';

const avocadoLogo = require('../assets/avocado.png');

const calungsodImage = require('../assets/team/calungsod.png');
const mateoImage     = require('../assets/team/mateo.png');
const talabaImage    = require('../assets/team/talaba.png');
const yagoImage      = require('../assets/team/yago.png');
const madriagaImage  = require('../assets/team/madriaga.jpg');

type RootStackParamList = {
  Home: undefined; About: undefined; Community: undefined;
  CommunityStack: undefined; Scan: undefined; Market: undefined;
  Profile: undefined; MainTabs: undefined;
};

type AboutScreenNavigationProp = StackNavigationProp<RootStackParamList, 'About'>;
type AboutScreenRouteProp      = RouteProp<RootStackParamList, 'About'>;

interface Props {
  navigation: AboutScreenNavigationProp;
  route:      AboutScreenRouteProp;
}

interface TeamMember {
  name: string; image?: any; bio: string; facebook?: string; email?: string;
}

const AboutScreen: React.FC<Props> = ({ navigation }) => {
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const { width } = dimensions;
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    return () => subscription?.remove();
  }, []);

  const teamMembers: TeamMember[] = [
    { name: 'Mary Pauline Calungsod', image: calungsodImage, bio: '3rd year Information Technology student', email: 'marypauline.calungsod@tup.edu.ph', facebook: 'https://www.facebook.com/Mary.Pauline.Cal' },
    { name: 'Xyrvi Mateo',            image: mateoImage,     bio: '3rd year Information Technology student', email: 'xyrvi.mateo@tup.edu.ph',            facebook: 'https://www.facebook.com/ivryxmateo11' },
    { name: 'Karl Jexel Talaba',      image: talabaImage,    bio: '3rd year Information Technology student', email: 'karljexel.talaba@tup.edu.ph',        facebook: 'https://www.facebook.com/karljexelavila.talaba' },
    { name: 'Alvin Symo Yago',        image: yagoImage,      bio: '3rd year Information Technology student', email: 'alvinsymo.yago@tup.edu.ph',          facebook: 'https://www.facebook.com/alvin.yago.1' },
    { name: 'Pops Madriaga',          image: madriagaImage,  bio: 'IT Professor',                            email: 'pops.madriaga@tup.edu.ph', },
  ];

  const features = [
    { icon: 'scan-outline',        title: 'Plant Disease Detection', description: 'AI-powered scanning to identify and diagnose plant health issues instantly.' },
    { icon: 'chatbubbles-outline', title: 'Expert Consultation',     description: 'Get real-time advice from agricultural experts through our smart chatbot.' },
    { icon: 'people-outline',      title: 'Community Forum',         description: 'Connect with fellow farmers and share knowledge across the network.' },
    { icon: 'analytics-outline',   title: 'Farm Analytics',          description: 'Track your farm performance with detailed insights and visual reports.' },
    { icon: 'cart-outline',        title: 'Marketplace',             description: 'Buy and sell avocado products directly through the platform.' },
    { icon: 'book-outline',        title: 'Learning Resources',      description: 'Access comprehensive guides on avocado cultivation best practices.' },
  ];

  const openURL = (url: string) => Linking.openURL(url).catch((err) => console.error('Failed to open URL:', err));

  const featureCols      = isMobile ? 1 : isTablet ? 2 : 3;
  const featureCardWidth = isMobile ? '100%' : `${Math.floor(100 / featureCols) - 2}%`;

  return (
      <View style={[styles.container, { backgroundColor: '#e8f2de' }]}>
      <ScrollView
        style={[
          Platform.OS === 'web' ? { height: '100vh' as any } : {},
          { backgroundColor: '#e8f2de' },
        ]}
        contentContainerStyle={[styles.scrollContent, { backgroundColor: '#e8f2de' }]}
        showsVerticalScrollIndicator={false}
        bounces={true}
        nestedScrollEnabled={true}
      >
        {/* ── Hero ── */}
        <View style={styles.heroSection}>
          <View style={[styles.heroContent, {
            paddingHorizontal: isMobile ? 16 : 40,
            maxWidth: 1100,
            alignSelf: 'center',
            width: '100%',
          }]}>

            {/* ── Back Button ── */}
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                alignSelf: 'flex-start',
                marginBottom: 16,
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: 20,
                backgroundColor: 'rgba(61, 107, 34, 0.12)',
              }}
            >
              <Ionicons name="arrow-back" size={20} color="#3d6b22" />
              <Text style={{ color: '#3d6b22', marginLeft: 6, fontWeight: '600', fontSize: 14 }}>
                Back
              </Text>
            </TouchableOpacity>

            <View style={styles.logoBadge}>
              <Image source={avocadoLogo} style={styles.logo} resizeMode="contain" />
            </View>
            <Text style={[styles.heroTitle, { fontSize: isMobile ? 28 : 38 }]}>About AvoCare</Text>
            <Text style={[styles.heroSubtitle, { fontSize: isMobile ? 14 : 16 }]}>
              Empowering Avocado Farmers Through Technology
            </Text>
            <View style={styles.heroDivider} />
          </View>
        </View>

        {/* ── Mission ── */}
        <View style={[styles.section, {
          paddingHorizontal: isMobile ? 16 : 40,
          maxWidth: 1100,
          alignSelf: 'center',
          width: '100%',
        }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconPill}>
              <Ionicons name="leaf-outline" size={20} color="#3d6b22" />
            </View>
            <Text style={[styles.sectionTitle, { fontSize: isMobile ? 20 : 24 }]}>Our Mission</Text>
          </View>
          <Text style={styles.missionText}>
            AvoCare is dedicated to revolutionizing avocado farming in the Philippines through
            innovative technology and community collaboration. We provide farmers with the tools
            they need to grow healthier crops, increase yields, and connect with a supportive
            network of agricultural professionals.
          </Text>
          <Text style={styles.missionText}>
            Our platform combines AI-powered plant disease detection, real-time expert consultation,
            comprehensive analytics, and a thriving marketplace to create an all-in-one solution
            for sustainable avocado cultivation.
          </Text>
        </View>

        {/* ── Features ── */}
        <View style={styles.featuresSection}>
          <View style={{
            paddingHorizontal: isMobile ? 16 : 40,
            maxWidth: 1100,
            alignSelf: 'center',
            width: '100%',
          }}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconPill}>
                <Ionicons name="grid-outline" size={20} color="#3d6b22" />
              </View>
              <Text style={[styles.sectionTitle, { fontSize: isMobile ? 20 : 24 }]}>Key Features</Text>
            </View>
            <View style={styles.featuresGrid}>
              {features.map((feature, index) => (
                <View key={index} style={[styles.featureCard, { width: featureCardWidth as any }]}>
                  <View style={styles.featureIconContainer}>
                    <Ionicons name={feature.icon as any} size={26} color="#3d6b22" />
                  </View>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ── Team ── */}
        <View style={[styles.teamSection, {
          paddingHorizontal: isMobile ? 16 : 40,
          maxWidth: 1100,
          alignSelf: 'center',
          width: '100%',
        }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconPill}>
              <Ionicons name="people-outline" size={20} color="#3d6b22" />
            </View>
            <Text style={[styles.sectionTitle, { fontSize: isMobile ? 20 : 24 }]}>Meet Our Team</Text>
          </View>
          <Text style={styles.teamIntro}>
            A dedicated team of developers and academic professionals working together to make
            AvoCare the premier platform for avocado farmers across the Philippines.
          </Text>
          <View style={[styles.teamGrid, { gap: isMobile ? 12 : 20 }]}>
            {teamMembers.map((member, index) => (
              <View
                key={index}
                style={[
                  styles.memberCard,
                  {
                    width:    isMobile ? '100%' : isTablet ? '46%' : '17%',
                    minWidth: isMobile ? undefined : 170,
                  },
                ]}
              >
                <View style={styles.memberImageContainer}>
                  {member.image ? (
                    <Image source={member.image} style={styles.memberImage} />
                  ) : (
                    <View style={styles.memberImagePlaceholder}>
                      <Ionicons name="person" size={36} color="#b0d890" />
                    </View>
                  )}
                </View>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberBio}>{member.bio}</Text>
                <View style={styles.memberLinks}>
                  {member.email && (
                    <TouchableOpacity style={styles.socialLink} onPress={() => openURL(`mailto:${member.email}`)}>
                      <Ionicons name="mail-outline" size={18} color="#3d6b22" />
                    </TouchableOpacity>
                  )}
                  {member.facebook && (
                    <TouchableOpacity style={styles.socialLink} onPress={() => openURL(member.facebook!)}>
                      <Ionicons name="logo-facebook" size={18} color="#3d6b22" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        <Footer />
      </ScrollView>
    </View>
  );
};

export default AboutScreen;