import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Image,
  Alert, ActivityIndicator, ScrollView,
  useWindowDimensions, Animated, Easing, Modal,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ripenessApi from '../Services/ripenessApi';
import fruitDiseaseApi from '../Services/fruitDiseaseApi';
import colorApi from '../Services/colorApi';
import historyService from '../Services/historyService';
import { getStyles } from '../Styles/FruitScanScreen.styles';

export interface FruitDetection {
  id: number;
  class: string;
  confidence: number;
  bbox: [number, number, number, number];
  bbox_absolute?: [number, number, number, number];
  all_probabilities: { [key: string]: number };
}

export interface FruitAnalysisResult {
  isAvocado: boolean;
  avocadoClass: string;
  avocadoConfidence: number;
  ripeness: string;
  ripeness_level: number;
  texture: string;
  days_to_ripe: string;
  recommendation: string;
  confidence: number;
  all_probabilities: { [key: string]: number };
  bbox?: [number, number, number, number];
  image_size?: { width: number; height: number };
  fruitDiseaseClass: string;
  fruitDiseaseDetections: FruitDetection[];
  fruitDiseaseCount: number;
  colorClass: string;
  colorConfidence: number;
  colorAllProbabilities: { [key: string]: number };
}

// ── Constants ─────────────────────────────────────────────────
const RIPENESS_COLORS: Record<string, string> = {
  underripe: '#7ab648', ripe: '#e8a020', overripe: '#c0392b',
};
const RIPENESS_DESCRIPTIONS: Record<string, string> = {
  underripe: 'Not ready — needs 4-7 days to ripen',
  ripe: 'Perfect to eat now! Best flavour & texture',
  overripe: 'Past peak — great for guacamole or smoothies',
};
const RIPENESS_EMOJI: Record<string, string> = { underripe: '🟢', ripe: '🟠', overripe: '🔴' };

// ── Color Classifications: Black | Green | Purple Brown ───────
const COLOR_HEX: Record<string, string> = {
  black:         '#1a1a1a',
  green:         '#4a8a2a',
  'purple brown':'#5c3a5a',
  // keep old keys as fallback in case API still returns them
  brown:         '#1a1a1a',
  purple:        '#5c3a5a',
};

const COLOR_EMOJI: Record<string, string> = {
  black:         '⚫',
  green:         '🟢',
  'purple brown':'🟤',
  brown:         '⚫',
  purple:        '🟤',
};

// Normalise API color string → display label
const normalizeColor = (raw: string): string => {
  const map: Record<string, string> = {
    black:         'black',
    green:         'green',
    'purple brown':'purple brown',
    'purple-brown':'purple brown',
    purplebrown:   'purple brown',
    brown:         'black',   // old "brown" maps to "black"
    purple:        'purple brown', // old "purple" maps to "purple brown"
  };
  return map[raw?.toLowerCase()] ?? raw?.toLowerCase();
};

const AVOCADO_BENEFITS: Record<string, { title: string; points: string[] }> = {
  underripe: { title: '🥑 Avocado Nutritional Benefits', points: ['Rich in heart-healthy monounsaturated fats (oleic acid)','Excellent source of dietary fiber — supports gut health','High in potassium — more than a banana, supports blood pressure','Contains folate, essential for cell function and during pregnancy','Packed with vitamins K, C, B5, and B6','Tip: Store at room temperature for 4–7 days to reach peak ripeness'] },
  ripe: { title: '🥑 Avocado Nutritional Benefits', points: ['Peak levels of healthy monounsaturated fats — great for heart health','High antioxidant content: lutein & zeaxanthin support eye health','Helps absorb fat-soluble vitamins (A, D, E, K) from other foods','Rich in potassium and magnesium — supports muscle and nerve function','Provides 10g of fiber per fruit — aids digestion and satiety','Naturally free of sodium, cholesterol, and trans fats','Tip: Refrigerate once cut; consume within 1–2 days for best quality'] },
  overripe: { title: '🥑 Avocado Nutritional Benefits', points: ['Monounsaturated fats remain intact and beneficial even when overripe','Still a great source of potassium and B vitamins','Ideal for blending into smoothies, dips, or spreads','Fiber content is unchanged — still supports digestive health','Tip: Remove any brown/stringy parts; use immediately in recipes','Perfect for guacamole, avocado toast, or baked avocado eggs'] },
};
const DISEASE_COLORS: Record<string, string> = {
  healthy: '#5a8a30', anthracnose: '#c0392b', scab: '#d4840a', 'stem end rot': '#7b3fa0',
  Healthy: '#5a8a30', Anthracnose: '#c0392b', Scab: '#d4840a', 'Stem End Rot': '#7b3fa0',
};
const DISEASE_EMOJI: Record<string, string> = {
  healthy: '✅', anthracnose: '🔴', scab: '🟡', 'stem end rot': '🟣',
  Healthy: '✅', Anthracnose: '🔴', Scab: '🟡', 'Stem End Rot': '🟣',
};
const DISEASE_LABELS: Record<string, string> = {
  healthy: 'HEALTHY', anthracnose: 'ANTHRACNOSE', scab: 'SCAB', 'stem end rot': 'STEM END ROT',
  Healthy: 'HEALTHY', Anthracnose: 'ANTHRACNOSE', Scab: 'SCAB', 'Stem End Rot': 'STEM END ROT',
};
const DISEASE_RECOMMENDATIONS: Record<string, string> = {
  healthy: 'Fruit is in excellent condition. Store in a cool, dry place away from direct sunlight. Keep refrigerated once ripe to extend freshness by 2–3 days.',
  Healthy: 'Fruit is in excellent condition. Store in a cool, dry place away from direct sunlight. Keep refrigerated once ripe to extend freshness by 2–3 days.',
  anthracnose: 'Anthracnose is a fungal infection caused by Colletotrichum gloeosporioides. Remove and destroy infected fruit immediately to prevent spread. Improve air circulation and apply copper-based fungicides during humid seasons.',
  Anthracnose: 'Anthracnose is a fungal infection caused by Colletotrichum gloeosporioides. Remove and destroy infected fruit immediately to prevent spread. Improve air circulation and apply copper-based fungicides during humid seasons.',
  scab: 'Scab (Sphaceloma perseae) presents as rough corky lesions. Remove affected fruit, apply protective fungicides during early development, and prune to improve airflow. Flesh beneath lesions may still be edible.',
  Scab: 'Scab (Sphaceloma perseae) presents as rough corky lesions. Remove affected fruit, apply protective fungicides during early development, and prune to improve airflow. Flesh beneath lesions may still be edible.',
  'stem end rot': 'Stem End Rot (Lasiodiplodia, Dothiorella) — remove affected fruit immediately. Avoid stem damage during picking. Post-harvest: treat with hot water (50°C for 10 min) or fungicide dips.',
  'Stem End Rot': 'Stem End Rot (Lasiodiplodia, Dothiorella) — remove affected fruit immediately. Avoid stem damage during picking. Post-harvest: treat with hot water (50°C for 10 min) or fungicide dips.',
};
const DISEASE_AVOCADO_BENEFITS: Record<string, { title: string; points: string[] }> = {
  healthy: { title: '🥑 Why Eat This Avocado?', points: ['Heart-healthy monounsaturated fats lower LDL cholesterol','Rich in potassium — supports healthy blood pressure','High fiber content promotes gut health and satiety','Lutein & zeaxanthin protect against macular degeneration','Folate supports brain health and is essential during pregnancy'] },
  Healthy: { title: '🥑 Why Eat This Avocado?', points: ['Heart-healthy monounsaturated fats lower LDL cholesterol','Rich in potassium — supports healthy blood pressure','High fiber content promotes gut health and satiety','Lutein & zeaxanthin protect against macular degeneration','Folate supports brain health and is essential during pregnancy'] },
  anthracnose: { title: '⚠️ Health Advisory', points: ['Infected fruit should NOT be consumed — discard immediately','Fungal toxins from Colletotrichum may pose health risks','Even if flesh appears unaffected, contamination may be present'] },
  Anthracnose: { title: '⚠️ Health Advisory', points: ['Infected fruit should NOT be consumed — discard immediately','Fungal toxins from Colletotrichum may pose health risks','Even if flesh appears unaffected, contamination may be present'] },
  scab: { title: '🔍 Consumption Guidance', points: ['Surface lesions are cosmetic — peel carefully and inspect flesh','Firm, green, undamaged flesh is generally safe to eat','Scab does not produce dangerous toxins','Discard any brown, mushy, or off-smelling portions'] },
  Scab: { title: '🔍 Consumption Guidance', points: ['Surface lesions are cosmetic — peel carefully and inspect flesh','Firm, green, undamaged flesh is generally safe to eat','Scab does not produce dangerous toxins','Discard any brown, mushy, or off-smelling portions'] },
  'stem end rot': { title: '⚠️ Health Advisory', points: ['Stem End Rot causes internal browning — do NOT consume affected flesh','Discard if more than 25% of the flesh is brown/mushy','The fungal pathogens involved can cause gastrointestinal irritation'] },
  'Stem End Rot': { title: '⚠️ Health Advisory', points: ['Stem End Rot causes internal browning — do NOT consume affected flesh','Discard if more than 25% of the flesh is brown/mushy','The fungal pathogens involved can cause gastrointestinal irritation'] },
};

const SPLIT_BREAKPOINT = 768;

// ── FadeSlide ─────────────────────────────────────────────────
const FadeSlide: React.FC<{ visible: boolean; children: React.ReactNode; delay?: number }> = ({ visible, children, delay = 0 }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 360, delay, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
        Animated.timing(translateY, { toValue: 0, duration: 360, delay, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      ]).start();
    } else { opacity.setValue(0); translateY.setValue(16); }
  }, [visible]);
  return <Animated.View style={{ opacity, transform: [{ translateY }] }}>{children}</Animated.View>;
};

// ── PulseButton ───────────────────────────────────────────────
const PulseButton: React.FC<{ onPress: () => void; disabled: boolean; style: any; children: React.ReactNode }> = ({ onPress, disabled, style, children }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const pulse = () => Animated.sequence([
    Animated.timing(scale, { toValue: 0.91, duration: 80, useNativeDriver: true }),
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 4 }),
  ]).start();
  return (
    <TouchableOpacity onPress={() => { pulse(); onPress(); }} disabled={disabled} activeOpacity={1}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </TouchableOpacity>
  );
};

// ── Save Success Popup ────────────────────────────────────────
interface SavePopupProps {
  visible: boolean;
  onViewHistory: () => void;
  onClose: () => void;
  styles: any;
}
const SaveSuccessPopup: React.FC<SavePopupProps> = ({ visible, onViewHistory, onClose, styles }) => {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 6, tension: 80 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;
  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      <Animated.View style={[styles.popupOverlay, { opacity: opacityAnim }]}>
        <Animated.View style={[styles.popupCard, { transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.popupIconCircle}>
            <Text style={{ fontSize: 32 }}>🎉</Text>
          </View>
          <Text style={styles.popupTitle}>Analysis Saved!</Text>
          <Text style={styles.popupSubtitle}>
            Your avocado analysis and image have been saved to your history.
          </Text>
          <TouchableOpacity style={styles.popupPrimaryBtn} onPress={onViewHistory} activeOpacity={0.85}>
            <Text style={styles.popupPrimaryBtnText}>View in History</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.popupSecondaryBtn} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.popupSecondaryBtnText}>Stay Here</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

// ── Main component ────────────────────────────────────────────
const FruitScanScreen: React.FC = ({ navigation }: any) => {
  const { width: windowWidth } = useWindowDimensions();
  const isWide = windowWidth >= SPLIT_BREAKPOINT;
  const styles = getStyles(isWide);

  const [permission, requestPermission] = useCameraPermissions();
  const [scanning,      setScanning]      = useState(false);
  const [analyzing,     setAnalyzing]     = useState(false);
  const [progress,      setProgress]      = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [result,        setResult]        = useState<FruitAnalysisResult | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [rejectionInfo, setRejectionInfo] = useState<{ class: string; confidence: number } | null>(null);
  const [facing,        setFacing]        = useState<CameraType>('back');
  const [flash,         setFlash]         = useState<'off' | 'on'>('off');
  const [saving,        setSaving]        = useState(false);
  const [showSavePopup, setShowSavePopup] = useState(false);

  const cameraRef    = useRef<CameraView>(null);
  const analyzingRef = useRef(false);

  // ── Scan line animation ───────────────────────────────────
  const scanLineY   = useRef(new Animated.Value(28)).current;
  const scanLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  useEffect(() => {
    if (scanning) {
      scanLoopRef.current = Animated.loop(Animated.sequence([
        Animated.timing(scanLineY, { toValue: 340, duration: 2200, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
        Animated.timing(scanLineY, { toValue: 28,  duration: 2200, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
      ]));
      scanLoopRef.current.start();
    } else { scanLoopRef.current?.stop(); scanLineY.setValue(28); }
    return () => scanLoopRef.current?.stop();
  }, [scanning]);

  // ── Corner pulse ──────────────────────────────────────────
  const cornerOpacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (scanning) {
      const loop = Animated.loop(Animated.sequence([
        Animated.timing(cornerOpacity, { toValue: 0.3, duration: 900, useNativeDriver: true }),
        Animated.timing(cornerOpacity, { toValue: 1,   duration: 900, useNativeDriver: true }),
      ]));
      loop.start();
      return () => loop.stop();
    } else { cornerOpacity.setValue(1); }
  }, [scanning]);

  // ── Result entrance ───────────────────────────────────────
  const resultAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (result) {
      Animated.spring(resultAnim, { toValue: 1, useNativeDriver: true, friction: 7, tension: 50 }).start();
    } else { resultAnim.setValue(0); }
  }, [result]);

  useEffect(() => {
    Promise.all([ripenessApi.checkHealth(), fruitDiseaseApi.checkHealth(), colorApi.checkHealth()]);
  }, []);

  const resetScan = useCallback(() => {
    analyzingRef.current = false;
    setCapturedImage(null); setResult(null); setAnalyzing(false);
    setProgress(0); setProgressLabel(''); setRejectionInfo(null);
  }, []);

  const startCamera = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) { Alert.alert('Permission Required', 'Camera access needed.'); return; }
    }
    resetScan();
    setScanning(true);
  };
  const stopCamera   = () => { setScanning(false); setFlash('off'); };
  const switchCamera = () => setFacing(c => c === 'back' ? 'front' : 'back');
  const handleFlash  = () => setFlash(c => c === 'off' ? 'on' : 'off');

  const captureImage = async () => {
    if (!cameraRef.current || analyzingRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (!photo?.uri) { Alert.alert('Error', 'Failed to capture image'); return; }
      stopCamera();
      setCapturedImage(photo.uri);
      runPipeline(photo.uri);
    } catch { Alert.alert('Error', 'Failed to capture image'); }
  };

  const handleFileUpload = async () => {
    if (analyzingRef.current) return;
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, quality: 0.8,
      });
      if (!res.canceled && res.assets[0]?.uri) {
        setCapturedImage(res.assets[0].uri);
        runPipeline(res.assets[0].uri);
      }
    } catch { Alert.alert('Error', 'Failed to upload image'); }
  };

  const runPipeline = async (img: string) => {
    if (analyzingRef.current) return;
    analyzingRef.current = true;
    setAnalyzing(true); setProgress(0); setProgressLabel(''); setRejectionInfo(null); setResult(null);
    try {
      setProgressLabel('Stage 1/4 — Checking if image contains an avocado…');
      setProgress(10);
      const avocadoCheck = await fruitDiseaseApi.checkIsAvocado(img);
      if (!avocadoCheck.success) throw new Error(avocadoCheck.error || 'Avocado classification failed');
      if (!avocadoCheck.isAvocado) {
        analyzingRef.current = false;
        setAnalyzing(false); setProgress(0); setProgressLabel('');
        setRejectionInfo({ class: avocadoCheck.class, confidence: avocadoCheck.confidence });
        return;
      }
      setProgress(33); setProgressLabel('Stage 2-4/4 — Analysing ripeness, disease & colour…');
      const [ripenessRes, diseaseRes, colorRes] = await Promise.all([
        ripenessApi.predictRipeness(img),
        fruitDiseaseApi.predictFruitDisease(img),
        colorApi.predictColor(img),
      ]);
      setProgress(90);
      if (!ripenessRes.success || !ripenessRes.prediction) throw new Error(ripenessRes.error || 'Ripeness analysis failed');
      if (!diseaseRes.success || !diseaseRes.prediction) throw new Error(diseaseRes.error || 'Disease analysis failed');
      const primary = ripenessRes.prediction;

      // Normalise the color class from the API
      const rawColor = colorRes.success && colorRes.color ? colorRes.color : 'unknown';
      const normalizedColor = rawColor !== 'unknown' ? normalizeColor(rawColor) : 'unknown';

      // If ripeness is ripe/overripe and disease is anthracnose, treat as healthy
      const ripenessLower = primary.ripeness?.toLowerCase();
      const rawDiseaseClass = diseaseRes.prediction.class;
      const resolvedDiseaseClass =
        (ripenessLower === 'ripe' || ripenessLower === 'overripe') &&
        rawDiseaseClass?.toLowerCase() === 'anthracnose'
          ? 'healthy'
          : rawDiseaseClass;

      const analysisResult: FruitAnalysisResult = {
        isAvocado: true,
        avocadoClass: avocadoCheck.class, avocadoConfidence: avocadoCheck.confidence,
        ripeness: primary.ripeness, ripeness_level: primary.ripeness_level,
        texture: primary.texture, confidence: primary.confidence,
        days_to_ripe: primary.days_to_ripe, recommendation: primary.recommendation,
        all_probabilities: ripenessRes.all_probabilities ?? {},
        bbox: primary.bbox, image_size: ripenessRes.image_size || diseaseRes.image_size,
        fruitDiseaseClass: resolvedDiseaseClass,
        fruitDiseaseDetections: resolvedDiseaseClass !== rawDiseaseClass
          ? (diseaseRes.detections || []).map(d => ({ ...d, class: resolvedDiseaseClass }))
          : (diseaseRes.detections || []),
        fruitDiseaseCount: diseaseRes.count || 1,
        colorClass: normalizedColor,
        colorConfidence: colorRes.success ? (colorRes.confidence ?? 0) : 0,
        colorAllProbabilities: colorRes.success ? (colorRes.all_probabilities ?? {}) : {},
      };
      setProgress(100);
      setTimeout(() => {
        analyzingRef.current = false;
        setAnalyzing(false); setProgressLabel(''); setResult(analysisResult);
      }, 400);
    } catch (error) {
      analyzingRef.current = false;
      setAnalyzing(false); setProgress(0); setProgressLabel('');
      Alert.alert('Analysis Failed',
        error instanceof Error ? error.message : 'Could not analyse the image.',
        [{ text: 'Retry', onPress: () => runPipeline(img) }, { text: 'Cancel', onPress: resetScan }],
      );
    }
  };

  const handleSave = async () => {
    if (!result) return;
    try {
      const token = await AsyncStorage.getItem('token') || await AsyncStorage.getItem('jwt');
      if (!token) { Alert.alert('Login Required', 'Please login to save.'); return; }
    } catch { Alert.alert('Error', 'Could not verify login status'); return; }
    setSaving(true);
    try {
      const res = await historyService.saveRipenessAnalysis({
        prediction: {
          ripeness: result.ripeness, ripeness_level: result.ripeness_level,
          confidence: result.confidence, texture: result.texture,
          days_to_ripe: result.days_to_ripe, recommendation: result.recommendation,
          bbox: result.bbox || [0, 0, 1, 1],
          color: result.colorClass !== 'unknown' ? result.colorClass : undefined,
          color_metrics: result.colorClass !== 'unknown' ? { confidence: result.colorConfidence, ...result.colorAllProbabilities } : undefined,
        },
        all_probabilities: result.all_probabilities,
        image_size: result.image_size || { width: 800, height: 600 },
        count: 1, notes: '', imageUri: capturedImage ?? undefined,
      });
      if (result.fruitDiseaseClass && result.fruitDiseaseDetections.length) {
        await historyService.saveFruitDiseaseAnalysis({
          prediction: { class: result.fruitDiseaseClass, confidence: result.fruitDiseaseDetections[0]?.confidence || result.confidence, bbox: result.fruitDiseaseDetections[0]?.bbox || result.bbox, all_probabilities: result.fruitDiseaseDetections[0]?.all_probabilities || {} },
          detections: result.fruitDiseaseDetections,
          recommendation: DISEASE_RECOMMENDATIONS[result.fruitDiseaseClass] || '',
          image_size: result.image_size || { width: 800, height: 600 },
          count: result.fruitDiseaseCount, notes: '', imageUri: capturedImage ?? undefined,
        });
      }
      if (res?.success) {
        setShowSavePopup(true);
      } else {
        throw new Error(res?.message || 'Failed to save');
      }
    } catch (e) {
      Alert.alert('Save Failed', e instanceof Error ? e.message : 'Please try again.');
    } finally { setSaving(false); }
  };

  const handleViewHistory = () => {
    setShowSavePopup(false);
    navigation?.navigate('History');
  };

  // ── Permission guards ─────────────────────────────────────
  if (!permission)
    return <View style={styles.centerContainer}><ActivityIndicator size="large" color="#7ab648" /></View>;
  if (!permission.granted)
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="leaf-outline" size={64} color="#c5dba0" />
        <Text style={styles.errorTitle}>Camera Access Required</Text>
        <Text style={styles.errorText}>Please grant camera permissions to scan your avocado</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );

  // ── Camera block ──────────────────────────────────────────
  const renderCameraBlock = () => (
    <>
      <View style={styles.cameraArea}>
        {/* Frame corners */}
        {(scanning || capturedImage) && (
          <View style={styles.frameOverlay}>
            <Animated.View style={[styles.frameCorner, styles.topLeft,    { opacity: cornerOpacity }]} />
            <Animated.View style={[styles.frameCorner, styles.topRight,   { opacity: cornerOpacity }]} />
            <Animated.View style={[styles.frameCorner, styles.bottomLeft, { opacity: cornerOpacity }]} />
            <Animated.View style={[styles.frameCorner, styles.bottomRight,{ opacity: cornerOpacity }]} />
          </View>
        )}
        {scanning && <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanLineY }] }]} />}

        {scanning && (
          <>
            <CameraView ref={cameraRef} style={styles.camera} facing={facing} enableTorch={flash === 'on'} />
            {!isWide && (
              <View style={styles.scanHeader}>
                <Text style={styles.scanHeaderTitle}>Scan Avocado</Text>
                <Text style={styles.scanHeaderSubtitle}>Point your camera at an avocado and capture it.</Text>
              </View>
            )}
            <View style={styles.cameraControls}>
              <TouchableOpacity style={styles.controlButton} onPress={switchCamera}>
                <Ionicons name="camera-reverse-outline" size={22} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.controlButton, flash === 'on' && styles.controlButtonActive]} onPress={handleFlash}>
                <Ionicons name={flash === 'on' ? 'flash' : 'flash-outline'} size={22} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.cameraStatus}>
              <View style={styles.cameraStatusDot} />
              <Text style={styles.cameraStatusText}>Camera Active</Text>
            </View>
            <Text style={styles.scanInstruction}>Position avocado in frame</Text>
            <TouchableOpacity style={styles.closeButton} onPress={stopCamera}>
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
          </>
        )}

        {capturedImage && !scanning && (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            <Image source={{ uri: capturedImage }} style={{ flex: 1, width: '100%' }} resizeMode="contain" />
          </View>
        )}

        {!scanning && !capturedImage && (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderIcon}>🥑</Text>
            <Text style={styles.placeholderTitle}>
              {isWide ? 'Ready to Scan' : 'Scan Avocado'}
            </Text>
            {!isWide && (
              <Text style={styles.scanHeaderSubtitle} numberOfLines={2}>
                Point your camera at an avocado and capture it.
              </Text>
            )}
            {isWide && (
              <Text style={styles.placeholderText}>
                Confirms it's an avocado, then checks ripeness and disease.
              </Text>
            )}
            {!isWide && (
              <Text style={[styles.placeholderTapHint, { marginTop: 24 }]}>
                Tap to start scanning
              </Text>
            )}
          </View>
        )}

        {analyzing && (
          <View style={styles.progressOverlay}>
            <View style={styles.progressCard}>
              <ActivityIndicator size="large" color="#7ab648" />
              <Text style={styles.progressText}>{progress}%</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progress}%` as any }]} />
              </View>
              <Text style={styles.progressSubtext}>{progressLabel || 'Running analysis…'}</Text>
            </View>
          </View>
        )}

        {capturedImage && !analyzing && !result && !rejectionInfo && (
          <TouchableOpacity onPress={resetScan} style={styles.resetButton}>
            <Ionicons name="close" size={20} color="white" />
          </TouchableOpacity>
        )}
      </View>

      {(!capturedImage || scanning) && (
        <View style={styles.actionButtons}>
          {scanning ? (
            <>
              {!isWide && (
                <TouchableOpacity style={styles.uploadPill} onPress={handleFileUpload} disabled={analyzing}>
                  <Text style={styles.uploadPillText}>Upload From Gallery</Text>
                  <Ionicons name="share-outline" size={18} color="#1a2e12" />
                </TouchableOpacity>
              )}
              <PulseButton onPress={captureImage} disabled={analyzing} style={styles.captureButton}>
                <View style={styles.captureInner} />
              </PulseButton>
            </>
          ) : (
            <>
              <TouchableOpacity
                onPress={startCamera}
                disabled={analyzing}
                style={[styles.actionButton, styles.primaryButton]}
                activeOpacity={0.85}
              >
                <Ionicons name="camera-outline" size={18} color="#0f1f0a" />
                <Text style={styles.actionButtonText}>Start Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleFileUpload}
                disabled={analyzing}
                style={[styles.actionButton, styles.secondaryButton]}
                activeOpacity={0.85}
              >
                <Ionicons name="cloud-upload-outline" size={18} color="#7ab648" />
                <Text style={styles.secondaryButtonText}>Upload Image</Text>
              </TouchableOpacity>
            </>
          )}
          {!scanning && (
            <Text style={styles.instructions}>
              The app verifies it's an avocado, then analyses ripeness and disease.
            </Text>
          )}
        </View>
      )}
    </>
  );

  const renderBenefitsCard = (benefits: { title: string; points: string[] }) => (
    <View style={styles.benefitsCard}>
      <Text style={styles.benefitsTitle}>{benefits.title}</Text>
      {benefits.points.map((point, i) => (
        <View key={i} style={styles.benefitRow}>
          <Text style={styles.benefitBullet}>•</Text>
          <Text style={styles.benefitText}>{point}</Text>
        </View>
      ))}
    </View>
  );

  // ── Results block ─────────────────────────────────────────
  const renderResultsBlock = () => (
    <>
      {!result && !rejectionInfo && (
        <FadeSlide visible>
          <View style={styles.emptyResult}>
            <Text style={styles.emptyResultIcon}>📊</Text>
            <Text style={styles.emptyResultText}>
              Analysis results will appear here after scanning an avocado.
            </Text>
          </View>
        </FadeSlide>
      )}

      <FadeSlide visible={!!(rejectionInfo && capturedImage && !result)}>
        {rejectionInfo && capturedImage && !result ? (
          <View style={[styles.resultCard, { borderColor: '#c0392b', borderWidth: 2 }]}>
            <View style={[styles.gateBadge, { backgroundColor: '#c0392b' }]}>
              <Ionicons name="close-circle" size={16} color="#fff" />
              <Text style={styles.gateBadgeText}>🚫 Not an Avocado</Text>
            </View>
            <View style={[styles.statusIndicator, { backgroundColor: '#c0392b' }]}>
              <Text style={styles.statusTitle}>❌ REJECTED</Text>
              <Text style={styles.statusDescription}>Image contains "{rejectionInfo.class}" — not an avocado</Text>
            </View>
            <View style={styles.rejectionDetails}>
              <Text style={styles.rejectionConfidence}>Detection confidence: {(rejectionInfo.confidence * 100).toFixed(1)}%</Text>
              <Text style={styles.rejectionHint}>This image cannot be analysed for avocado ripeness or disease.</Text>
            </View>
            <TouchableOpacity style={styles.saveButton} onPress={resetScan}>
              <Text style={styles.saveButtonText}>Try Another Image</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </FadeSlide>

      {result && capturedImage && (
        <Animated.View style={[styles.resultCard, {
          opacity: resultAnim,
          transform: [{ scale: resultAnim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }],
        }]}>
          <FadeSlide visible delay={0}>
            <View style={styles.gateBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#fff" />
              <Text style={styles.gateBadgeText}>✅ Avocado confirmed ({(result.avocadoConfidence * 100).toFixed(1)}%)</Text>
            </View>
          </FadeSlide>
          <FadeSlide visible delay={60}>
            <View style={[styles.statusIndicator, { backgroundColor: RIPENESS_COLORS[result.ripeness] || '#5a8a30' }]}>
              <Text style={styles.statusTitle}>{RIPENESS_EMOJI[result.ripeness]} {result.ripeness?.toUpperCase()}</Text>
              <Text style={styles.statusDescription}>{RIPENESS_DESCRIPTIONS[result.ripeness]}</Text>
            </View>
          </FadeSlide>
          <FadeSlide visible delay={120}>
            <View style={styles.infoCard}>
              {([
                ['RIPENESS', result.ripeness?.toUpperCase(), RIPENESS_COLORS[result.ripeness]],
                ['TEXTURE', result.texture, undefined],
                ['DAYS TO RIPE', result.days_to_ripe, undefined],
                ['CONFIDENCE', `${(result.confidence * 100).toFixed(1)}%`, undefined],
              ] as [string, string, string | undefined][]).map(([label, value, color]) => (
                <View key={label} style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{label}</Text>
                  <Text style={[styles.infoValue, color ? { color } : {}]}>{value}</Text>
                </View>
              ))}
            </View>
          </FadeSlide>
          <FadeSlide visible delay={160}>
            <View style={[styles.confidenceRow, {
              backgroundColor: `${RIPENESS_COLORS[result.ripeness] || '#5a8a30'}12`,
              borderColor: `${RIPENESS_COLORS[result.ripeness] || '#5a8a30'}30`,
            }]}>
              <Text style={styles.confidenceLabel}>Confidence</Text>
              <View style={styles.confidenceTrack}>
                <View style={[styles.confidenceFill, { width: `${result.confidence * 100}%` as any, backgroundColor: RIPENESS_COLORS[result.ripeness] || '#5a8a30' }]} />
              </View>
              <Text style={[styles.confidenceValue, { color: RIPENESS_COLORS[result.ripeness] || '#2d5a10' }]}>{(result.confidence * 100).toFixed(1)}%</Text>
            </View>
          </FadeSlide>

          {/* ── Skin Colour Card ── */}
          {result.colorClass && result.colorClass !== 'unknown' && (
            <FadeSlide visible delay={200}>
              <View style={[
                styles.infoCard,
                {
                  borderLeftWidth: 4,
                  borderLeftColor: COLOR_HEX[result.colorClass] || '#999',
                  marginTop: 4,
                  paddingLeft: 12,
                  backgroundColor: `${COLOR_HEX[result.colorClass] || '#999'}08`,
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 14,
                },
              ]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <View style={{
                    width: 14, height: 14, borderRadius: 7,
                    backgroundColor: COLOR_HEX[result.colorClass] || '#999',
                    marginRight: 8,
                    borderWidth: 1,
                    borderColor: 'rgba(0,0,0,0.15)',
                  }} />
                  <Text style={[styles.infoLabel, { flex: 0 }]}>SKIN COLOUR</Text>
                  <Text style={[
                    styles.infoValue,
                    { color: COLOR_HEX[result.colorClass] || '#333', marginLeft: 'auto' as any },
                  ]}>
                    {COLOR_EMOJI[result.colorClass]}{' '}
                    {result.colorClass.toUpperCase()}
                  </Text>
                </View>
                <Text style={{ fontSize: 12, color: '#6b8c52', marginBottom: 8, lineHeight: 17 }}>
                </Text>
                <View style={styles.miniProbRow}>
                  <Text style={styles.miniProbLabel}>{result.colorClass}</Text>
                  <View style={styles.miniProbBar}>
                    <View style={[
                      styles.miniProbFill,
                      {
                        width: `${result.colorConfidence * 100}%` as any,
                        backgroundColor: COLOR_HEX[result.colorClass] || '#999',
                      },
                    ]} />
                  </View>
                  <Text style={styles.miniProbValue}>{(result.colorConfidence * 100).toFixed(0)}%</Text>
                </View>
              </View>
            </FadeSlide>
          )}

          {result.recommendation && (
            <FadeSlide visible delay={240}>
              <View style={styles.recommendationCard}>
                <Text style={styles.recommendationTitle}>💡 Recommendation</Text>
                <Text style={styles.recommendationText}>{result.recommendation}</Text>
              </View>
            </FadeSlide>
          )}

          {AVOCADO_BENEFITS[result.ripeness] && (
            <FadeSlide visible delay={280}>
              {renderBenefitsCard(AVOCADO_BENEFITS[result.ripeness])}
            </FadeSlide>
          )}

          {result.fruitDiseaseDetections.length > 0 && (
            <FadeSlide visible delay={320}>
              <>
                <View style={styles.sectionBanner}>
                  <Ionicons name="warning-outline" size={16} color="#7ab648" />
                  <Text style={styles.sectionBannerText}>Disease Analysis · {result.fruitDiseaseDetections.length} Region(s)</Text>
                </View>
                <View style={styles.detectionsContainer}>
                  <Text style={styles.detectionsTitle}>🩺 Disease Analysis</Text>
                  {result.fruitDiseaseDetections.map((det, idx) => (
                    <View key={det.id || idx} style={[styles.detectionCard, { borderLeftColor: DISEASE_COLORS[det.class] || '#999', backgroundColor: `${DISEASE_COLORS[det.class] || '#999'}06` }]}>
                      <View style={styles.detectionHeader}>
                        <View style={styles.detectionTitleRow}>
                          <Text style={[styles.detectionNum, { color: DISEASE_COLORS[det.class] || '#5a8a30' }]}>#{det.id}</Text>
                          <Text style={[styles.detectionClass, { color: DISEASE_COLORS[det.class] || '#333' }]}>{DISEASE_EMOJI[det.class]} {DISEASE_LABELS[det.class] || det.class.toUpperCase()}</Text>
                          {idx === 0 && <View style={styles.primaryBadge}><Text style={styles.primaryBadgeText}>PRIMARY</Text></View>}
                        </View>
                        <View style={[styles.confidenceBadge, { backgroundColor: `${DISEASE_COLORS[det.class] || '#999'}18` }]}>
                          <Text style={[styles.confidenceBadgeText, { color: DISEASE_COLORS[det.class] || '#333' }]}>{(det.confidence * 100).toFixed(1)}%</Text>
                        </View>
                      </View>
                      <View style={styles.miniProbContainer}>
                        <View style={styles.miniProbRow}>
                          <Text style={styles.miniProbLabel}>{det.class}</Text>
                          <View style={styles.miniProbBar}>
                            <View style={[styles.miniProbFill, { width: `${det.confidence * 100}%` as any, backgroundColor: DISEASE_COLORS[det.class] || '#999' }]} />
                          </View>
                          <Text style={styles.miniProbValue}>{(det.confidence * 100).toFixed(0)}%</Text>
                        </View>
                      </View>
                      <View style={styles.miniRec}>
                        <Text style={[styles.miniRecTitle, { color: DISEASE_COLORS[det.class] || '#333' }]}>🩹 What to do:</Text>
                        <Text style={styles.miniRecText}>{DISEASE_RECOMMENDATIONS[det.class] || 'Monitor condition closely.'}</Text>
                      </View>
                      {idx === 0 && DISEASE_AVOCADO_BENEFITS[det.class] && (
                        <View style={[styles.miniRec, { marginTop: 10, backgroundColor: `${DISEASE_COLORS[det.class] || '#999'}0e`, borderRadius: 8, padding: 10 }]}>
                          <Text style={[styles.miniRecTitle, { color: DISEASE_COLORS[det.class] || '#333', marginBottom: 6 }]}>{DISEASE_AVOCADO_BENEFITS[det.class].title}</Text>
                          {DISEASE_AVOCADO_BENEFITS[det.class].points.map((point, pi) => (
                            <View key={pi} style={styles.benefitRow}>
                              <Text style={styles.benefitBullet}>•</Text>
                              <Text style={styles.benefitText}>{point}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              </>
            </FadeSlide>
          )}

          <FadeSlide visible delay={360}>
            <>
              <View style={styles.imageSaveNote}>
                <Ionicons name="image-outline" size={13} color="#b0c8a0" />
                <Text style={styles.imageSaveNoteText}>Image will be saved with this analysis</Text>
              </View>
              <View style={styles.buttonGroup}>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
                  <Text style={styles.saveButtonText}>{saving ? 'SAVING…' : 'SAVE ANALYSIS'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.scanAgainButton} onPress={resetScan} activeOpacity={0.85}>
                  <Text style={styles.scanAgainButtonText}>SCAN AGAIN</Text>
                </TouchableOpacity>
              </View>
            </>
          </FadeSlide>
        </Animated.View>
      )}
    </>
  );

  // ── Wide (web) layout ─────────────────────────────────────
  if (isWide) {
    return (
      <View style={styles.container}>
        <View style={styles.webWrapper}>
          <View style={styles.webLeftCard}>
            {renderCameraBlock()}
          </View>
          <View style={styles.webRightCard}>
            <ScrollView
              style={styles.webRightScroll}
              contentContainerStyle={styles.webRightContent}
              showsVerticalScrollIndicator={false}
            >
              {renderResultsBlock()}
            </ScrollView>
          </View>
        </View>
        <SaveSuccessPopup
          visible={showSavePopup}
          onViewHistory={handleViewHistory}
          onClose={() => setShowSavePopup(false)}
          styles={styles}
        />
      </View>
    );
  }

  // ── Mobile layout ─────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: '#f0f5eb' }]}>
      <ScrollView contentContainerStyle={styles.mobileScrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={!scanning && !capturedImage && !analyzing ? startCamera : undefined}
        >
          <View style={styles.mobileCameraSection}>
            {renderCameraBlock()}
          </View>
        </TouchableOpacity>
        <View style={styles.mobileResultsSection}>
          {renderResultsBlock()}
        </View>
      </ScrollView>
      <SaveSuccessPopup
        visible={showSavePopup}
        onViewHistory={handleViewHistory}
        onClose={() => setShowSavePopup(false)}
        styles={styles}
      />
    </View>
  );
};

export default FruitScanScreen;