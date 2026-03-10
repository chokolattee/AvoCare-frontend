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
import leavesApi, { LeavesResult } from '../Services/leavesApi';
import historyService from '../Services/historyService';
import { getStyles } from '../Styles/LeafScanScreen.styles';

export interface LeafDetection {
  id: number;
  class: string;
  confidence: number;
  bbox: [number, number, number, number];
  bbox_absolute?: [number, number, number, number];
  all_probabilities: { [key: string]: number };
}

export interface LeafAnalysisResult {
  leafClass: string;
  confidence: number;
  recommendation: string;
  all_probabilities: { [key: string]: number };
  bbox?: [number, number, number, number];
  detections: LeafDetection[];
  count: number;
  image_size?: { width: number; height: number };
  gate?: {
    class: string;
    confidence: number;
    all_probabilities: { [key: string]: number };
  };
}

const LEAF_COLORS: Record<string, string> = {
  healthy              : '#4CAF50', Healthy            : '#4CAF50',
  anthracnose          : '#F44336', Anthracnose        : '#F44336',
  'nutrient deficiency': '#FF9800', 'Nutrient Deficient': '#FF9800',
  'Pest Infested'      : '#9C27B0', 'pest infested'    : '#9C27B0',
};

const LEAF_DESCRIPTIONS: Record<string, string> = {
  healthy              : 'Plant is healthy! Continue current care routine',
  Healthy              : 'Plant is healthy! Continue current care routine',
  anthracnose          : 'Fungal disease detected — requires treatment',
  Anthracnose          : 'Fungal disease detected — requires treatment',
  'nutrient deficiency': 'Plant needs additional nutrients',
  'Nutrient Deficient' : 'Plant needs additional nutrients',
  'Pest Infested'      : 'Pest infestation detected — immediate action needed',
  'pest infested'      : 'Pest infestation detected — immediate action needed',
};

const LEAF_RECOMMENDATIONS: Record<string, string> = {
  healthy              : 'Maintain regular watering and fertilization schedule.',
  Healthy              : 'Maintain regular watering and fertilization schedule.',
  anthracnose          : 'Remove affected leaves, improve air circulation, and apply fungicide.',
  Anthracnose          : 'Remove affected leaves, improve air circulation, and apply fungicide.',
  'nutrient deficiency': 'Apply balanced fertilizer. Consider soil testing.',
  'Nutrient Deficient' : 'Apply balanced fertilizer. Consider soil testing.',
  'Pest Infested'      : 'Inspect closely and apply appropriate pesticide or natural control.',
  'pest infested'      : 'Inspect closely and apply appropriate pesticide or natural control.',
};

type AnalysisStep = 'idle' | 'checking_leaf' | 'detecting_disease' | 'done';

const STEP_LABELS: Record<AnalysisStep, string> = {
  idle             : '',
  checking_leaf    : 'Step 1: Checking if image is a leaf…',
  detecting_disease: 'Step 2: Detecting leaf health status…',
  done             : 'Analysis complete!',
};

const STEP_PROGRESS: Record<AnalysisStep, number> = {
  idle             : 0,
  checking_leaf    : 30,
  detecting_disease: 70,
  done             : 100,
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
    } else { scaleAnim.setValue(0.8); opacityAnim.setValue(0); }
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
            Your leaf analysis and image have been saved to your history.
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

const LeafScanScreen: React.FC = ({ navigation }: any) => {
  const { width: windowWidth } = useWindowDimensions();
  const isWide = windowWidth >= SPLIT_BREAKPOINT;
  const styles = getStyles(isWide);

  const [permission, requestPermission] = useCameraPermissions();
  const [scanning,      setScanning]      = useState(false);
  const [analyzing,     setAnalyzing]     = useState(false);
  const [analysisStep,  setAnalysisStep]  = useState<AnalysisStep>('idle');
  const [result,        setResult]        = useState<LeafAnalysisResult | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facing,        setFacing]        = useState<CameraType>('back');
  const [flash,         setFlash]         = useState<'off' | 'on'>('off');
  const [saving,        setSaving]        = useState(false);
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [notLeafError,  setNotLeafError]  = useState<string | null>(null);
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

  useEffect(() => { leavesApi.checkHealth(); }, []);

  const resetScan = useCallback(() => {
    setCapturedImage(null);
    setResult(null);
    setAnalyzing(false);
    setAnalysisStep('idle');
    setNotLeafError(null);
    analyzingRef.current = false;
  }, []);

  const handleViewHistory = () => {
    setShowSavePopup(false);
    navigation?.navigate('History');
  };

  const startCamera = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) { Alert.alert('Permission Required', 'Camera access needed.'); return; }
    }
    setNotLeafError(null);
    setScanning(true);
  };
  const stopCamera   = () => { setScanning(false); setFlash('off'); };
  const switchCamera = () => setFacing(c => c === 'back' ? 'front' : 'back');
  const handleFlash  = () => setFlash(c => c === 'off' ? 'on' : 'off');

  const captureImage = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (photo) {
        setCapturedImage(photo.uri);
        stopCamera();
        setTimeout(() => runAnalysis(photo.uri), 100);
      }
    } catch { Alert.alert('Error', 'Failed to capture image'); }
  };

  const handleFileUpload = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, quality: 0.8,
      });
      if (!res.canceled && res.assets[0]) {
        setNotLeafError(null);
        setCapturedImage(res.assets[0].uri);
        setTimeout(() => runAnalysis(res.assets[0].uri), 100);
      }
    } catch { Alert.alert('Error', 'Failed to upload image'); }
  };

  const runAnalysis = async (imageUri?: string) => {
    const img = imageUri || capturedImage;
    if (!img || analyzingRef.current) return;

    analyzingRef.current = true;
    setAnalyzing(true);
    setNotLeafError(null);

    try {
      setAnalysisStep('checking_leaf');
      await new Promise(r => setTimeout(r, 400));

      const apiResult: LeavesResult = await leavesApi.predictLeaves(img);

      if (apiResult.is_leaf === false) {
        const gateConf = apiResult.gate
          ? ` (${(apiResult.gate.confidence * 100).toFixed(0)}% confident)`
          : '';
        setNotLeafError(
          `No leaf detected in this image${gateConf}. Please take a photo of a leaf or plant and try again. 🌿`
        );
        setCapturedImage(img);
        return;
      }

      setAnalysisStep('detecting_disease');
      if (!apiResult.success || !apiResult.prediction) {
        throw new Error(apiResult.error || 'Leaf analysis failed');
      }

      setAnalysisStep('done');
      await new Promise(r => setTimeout(r, 300));

      setResult({
        leafClass        : apiResult.prediction.class,
        confidence       : apiResult.prediction.confidence,
        recommendation   : LEAF_RECOMMENDATIONS[apiResult.prediction.class] || '',
        all_probabilities: apiResult.prediction.all_probabilities,
        bbox             : apiResult.prediction.bbox || [0.25, 0.25, 0.5, 0.5],
        detections       : (apiResult.detections || []) as LeafDetection[],
        count            : apiResult.count || 1,
        image_size       : apiResult.image_size,
        gate             : apiResult.gate,
      });

    } catch (error) {
      Alert.alert(
        'Analysis Failed',
        error instanceof Error ? error.message : 'Could not analyse the image.',
        [
          { text: 'Retry',  onPress: () => runAnalysis(img) },
          { text: 'Cancel', onPress: resetScan },
        ],
      );
    } finally {
      analyzingRef.current = false;
      setAnalyzing(false);
      setAnalysisStep('idle');
    }
  };

  // ── Save — includes imageUri so the backend can persist the photo ──
  const handleSave = async () => {
    if (!result) return;
    try {
      const token = await AsyncStorage.getItem('token') || await AsyncStorage.getItem('jwt');
      if (!token) { Alert.alert('Login Required', 'Please login to save.'); return; }
    } catch {
      Alert.alert('Error', 'Could not verify login status');
      return;
    }
    setSaving(true);
    try {
      const res = await historyService.saveLeafAnalysis({
        prediction: {
          class     : result.leafClass,
          confidence: result.confidence,
          bbox      : result.bbox || [0.25, 0.25, 0.5, 0.5],
          all_probabilities: result.all_probabilities,
        },
        detections    : result.detections,
        recommendation: result.recommendation,
        image_size    : result.image_size || { width: 800, height: 600 },
        count         : result.count,
        notes         : '',
        imageUri      : capturedImage ?? undefined,   // ← image attached here
      });
      if (res?.success) setShowSavePopup(true);
      else throw new Error(res?.message || 'Failed to save');
    } catch (e) {
      Alert.alert('Save Failed', e instanceof Error ? e.message : 'Please try again.');
    } finally { setSaving(false); }
  };

  // ── Permission guards ─────────────────────────────────────
  if (!permission)
    return <View style={styles.centerContainer}><ActivityIndicator size="large" color="#7ab648" /></View>;
  if (!permission.granted)
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="leaf-outline" size={64} color="#c5dba0" />
        <Text style={styles.errorTitle}>Camera Access Required</Text>
        <Text style={styles.errorText}>Please grant camera permissions to scan your leaf</Text>
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
                <Text style={styles.scanHeaderTitle}>Scan Leaf</Text>
                <Text style={styles.scanHeaderSubtitle}>Point your camera at a leaf and capture it.</Text>
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
            <Text style={styles.scanInstruction}>Position leaf or stem in frame</Text>
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
            <Text style={styles.placeholderIcon}>🌿</Text>
            <Text style={styles.placeholderTitle}>
              {isWide ? 'Ready to Scan' : 'Scan Leaf'}
            </Text>
            {!isWide && (
              <Text style={styles.scanHeaderSubtitle} numberOfLines={2}>
                Point your camera at a leaf and capture it.
              </Text>
            )}
            {isWide && (
              <Text style={styles.placeholderText}>
                Scan a leaf or stem to detect disease, nutrient deficiency, or pest damage.
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
              <Text style={styles.progressText}>{STEP_PROGRESS[analysisStep]}%</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${STEP_PROGRESS[analysisStep]}%` as any }]} />
              </View>
              <Text style={styles.progressSubtext}>{STEP_LABELS[analysisStep] || 'Running analysis…'}</Text>
            </View>
          </View>
        )}

        {capturedImage && !analyzing && !result && !notLeafError && (
          <TouchableOpacity onPress={resetScan} style={styles.resetButton}>
            <Ionicons name="close" size={20} color="white" />
          </TouchableOpacity>
        )}
      </View>

      {/* Action buttons */}
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
              <TouchableOpacity onPress={startCamera} disabled={analyzing} style={[styles.actionButton, styles.primaryButton]} activeOpacity={0.85}>
                <Ionicons name="camera-outline" size={18} color="#0f1f0a" />
                <Text style={styles.actionButtonText}>Start Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleFileUpload} disabled={analyzing} style={[styles.actionButton, styles.secondaryButton]} activeOpacity={0.85}>
                <Ionicons name="cloud-upload-outline" size={18} color="#7ab648" />
                <Text style={styles.secondaryButtonText}>Upload Image</Text>
              </TouchableOpacity>
            </>
          )}
          {!scanning && (
            <Text style={styles.instructions}>
              Position the leaf or stem within the frame. Ensure good lighting for best results.
            </Text>
          )}
        </View>
      )}
    </>
  );

  // ── Results block ─────────────────────────────────────────
  const renderResultsBlock = () => (
    <>
      {!result && !notLeafError && (
        <FadeSlide visible>
          <View style={styles.emptyResult}>
            <Text style={styles.emptyResultIcon}>🌱</Text>
            <Text style={styles.emptyResultText}>
              Leaf analysis results will appear here after scanning.
            </Text>
          </View>
        </FadeSlide>
      )}

      <FadeSlide visible={!!(notLeafError && !analyzing)}>
        {notLeafError && !analyzing ? (
          <View style={[styles.resultCard, { borderColor: '#c0392b', borderWidth: 2 }]}>
            <View style={[styles.detectionBanner, { backgroundColor: '#c0392b' }]}>
              <Ionicons name="close-circle" size={16} color="#fff" />
              <Text style={styles.detectionBannerText}>🚫 No Leaf Detected</Text>
            </View>
            <View style={[styles.statusIndicator, { backgroundColor: '#c0392b' }]}>
              <Text style={styles.statusTitle}>❌ NOT A LEAF</Text>
              <Text style={styles.statusDescription}>{notLeafError}</Text>
            </View>
            <View style={styles.buttonGroup}>
              <TouchableOpacity style={[styles.actionButton, styles.primaryButton]} onPress={() => { resetScan(); startCamera(); }} activeOpacity={0.85}>
                <Ionicons name="camera-outline" size={18} color="#fff" />
                <Text style={styles.actionButtonText}>Try Camera Again</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]} onPress={() => { resetScan(); handleFileUpload(); }} activeOpacity={0.85}>
                <Ionicons name="cloud-upload-outline" size={18} color="#7ab648" />
                <Text style={styles.secondaryButtonText}>Upload Another</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </FadeSlide>

      {result && capturedImage && (
        <Animated.View style={[styles.resultCard, {
          opacity: resultAnim,
          transform: [{ scale: resultAnim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }],
        }]}>
          <FadeSlide visible delay={0}>
            {result.gate ? (
              <View style={[styles.detectionBanner, { backgroundColor: '#3d6b22', marginBottom: 14 }]}>
                <Ionicons name="checkmark-circle" size={16} color="#fff" />
                <Text style={styles.detectionBannerText}>✅ Leaf confirmed ({(result.gate.confidence * 100).toFixed(1)}%)</Text>
              </View>
            ) : null}
          </FadeSlide>

          <FadeSlide visible delay={60}>
            <>
              {result.detections.length > 1 && (
                <View style={styles.detectionBanner}>
                  <Ionicons name="leaf-outline" size={18} color="#fff" />
                  <Text style={styles.detectionBannerText}>{result.detections.length} Leaves Detected</Text>
                </View>
              )}
              <View style={[styles.statusIndicator, { backgroundColor: LEAF_COLORS[result.leafClass] || '#5a8a30' }]}>
                <Text style={styles.statusTitle}>{result.leafClass.toUpperCase()}</Text>
                <Text style={styles.statusDescription}>{LEAF_DESCRIPTIONS[result.leafClass]}</Text>
              </View>
            </>
          </FadeSlide>

          <FadeSlide visible delay={120}>
            <View style={styles.infoCard}>
              {([
                ['LEAVES DETECTED', String(result.detections.length || 1), undefined],
                ['PRIMARY STATUS',  result.leafClass,                        LEAF_COLORS[result.leafClass]],
                ['CONFIDENCE',      `${(result.confidence * 100).toFixed(1)}%`, undefined],
              ] as [string, string, string | undefined][]).map(([label, value, color]) => (
                <View key={label} style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{label}</Text>
                  <Text style={[styles.infoValue, color ? { color } : {}]}>{value}</Text>
                </View>
              ))}
            </View>
          </FadeSlide>

          {result.detections.length > 0 && (
            <FadeSlide visible delay={160}>
              <View style={styles.detectionsContainer}>
                <Text style={styles.detectionsTitle}>📋 Individual Leaf Analysis</Text>
                {result.detections.map((det, idx) => (
                  <View key={det.id || idx} style={[styles.detectionCard, {
                    borderLeftColor: LEAF_COLORS[det.class] || '#999',
                    backgroundColor: `${LEAF_COLORS[det.class] || '#999'}06`,
                  }]}>
                    <View style={styles.detectionHeader}>
                      <View style={styles.detectionTitleRow}>
                        <Text style={[styles.detectionNum, { color: LEAF_COLORS[det.class] || '#5a8a30' }]}>#{det.id}</Text>
                        <Text style={[styles.detectionClass, { color: LEAF_COLORS[det.class] || '#333' }]}>{det.class}</Text>
                        {idx === 0 && <View style={styles.primaryBadge}><Text style={styles.primaryBadgeText}>PRIMARY</Text></View>}
                      </View>
                      <View style={[styles.confidenceBadge, { backgroundColor: `${LEAF_COLORS[det.class] || '#999'}18` }]}>
                        <Text style={[styles.confidenceBadgeText, { color: LEAF_COLORS[det.class] || '#333' }]}>
                          {(det.confidence * 100).toFixed(1)}%
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
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

          <FadeSlide visible delay={280}>
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

export default LeafScanScreen;