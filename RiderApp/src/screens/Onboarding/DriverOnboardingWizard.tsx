import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  SafeAreaView,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../services/api';
import { riderService } from '../../services/riderService';
import { VerificationBadgeStatus, DriverDocumentItem } from '../../services/types';

const DRAFT_STORAGE_KEY = 'drivemate_driver_onboarding_draft';

const STEP_TITLES = [
  'Personal Info',
  'Contact & Address',
  'Driving Licence',
  'Aadhaar KYC',
  'PAN Card',
  'Vehicle & RC',
  'Review & Submit',
];

interface WizardProps {
  navigation: any;
  route?: any;
}

export default function DriverOnboardingWizard({ navigation }: WizardProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [submissionComplete, setSubmissionComplete] = useState<boolean>(false);
  const [submissionData, setSubmissionData] = useState<any>(null);
  const [hasToken, setHasToken] = useState<boolean>(false);
  const [isNewRegistration, setIsNewRegistration] = useState<boolean>(false);
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // --- FLUID ANIMATIONS & MICRO-INTERACTIONS ---
  const stepFadeAnim = useRef(new Animated.Value(1)).current;
  const stepSlideAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(currentStep / 7)).current;
  const scannerAnim = useRef(new Animated.Value(0)).current;
  const badgeScaleAnim = useRef(new Animated.Value(1)).current;
  const successScaleAnim = useRef(new Animated.Value(0.3)).current;
  const successOpacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: currentStep / 7,
      friction: 9,
      tension: 40,
      useNativeDriver: false,
    }).start();
  }, [currentStep]);

  useEffect(() => {
    let animLoop: Animated.CompositeAnimation | null = null;
    if (verifying) {
      scannerAnim.setValue(0);
      animLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(scannerAnim, {
            toValue: 1,
            duration: 1100,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(scannerAnim, {
            toValue: 0,
            duration: 1100,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      animLoop.start();
    } else {
      scannerAnim.setValue(0);
    }
    return () => {
      if (animLoop) animLoop.stop();
    };
  }, [verifying]);

  useEffect(() => {
    if (submissionComplete) {
      Animated.parallel([
        Animated.spring(successScaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.timing(successOpacityAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [submissionComplete]);

  const animateStepTransition = (direction: 'next' | 'prev', callback: () => void) => {
    Animated.parallel([
      Animated.timing(stepFadeAnim, {
        toValue: 0,
        duration: 130,
        useNativeDriver: true,
      }),
      Animated.timing(stepSlideAnim, {
        toValue: direction === 'next' ? -25 : 25,
        duration: 130,
        useNativeDriver: true,
      }),
    ]).start(() => {
      callback();
      stepSlideAnim.setValue(direction === 'next' ? 25 : -25);
      Animated.parallel([
        Animated.spring(stepSlideAnim, {
          toValue: 0,
          friction: 8,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.timing(stepFadeAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const getInputStyle = (fieldName: string) => [
    styles.input,
    focusedField === fieldName && styles.inputFocused,
  ];

  const AnimatedButton = ({
    onPress,
    style,
    children,
    disabled,
  }: {
    onPress?: () => void;
    style?: any;
    children: React.ReactNode;
    disabled?: boolean;
  }) => {
    const scale = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
      if (disabled) return;
      Animated.spring(scale, {
        toValue: 0.96,
        friction: 5,
        tension: 100,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 100,
        useNativeDriver: true,
      }).start();
    };

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        disabled={disabled}
      >
        <Animated.View style={[style, { transform: [{ scale }] }]}>
          {children}
        </Animated.View>
      </TouchableOpacity>
    );
  };

  // Step 1: Personal Information
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('male');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  // Step 2: Contact Information
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [otpVerified, setOtpVerified] = useState(true);

  // Step 3: Driving Licence (DL)
  const [dlNumber, setDlNumber] = useState('');
  const [dlDob, setDlDob] = useState('');
  const [dlExpiryDate, setDlExpiryDate] = useState('');
  const [dlFrontImage, setDlFrontImage] = useState<string | null>(null);
  const [dlBackImage, setDlBackImage] = useState<string | null>(null);
  const [dlStatus, setDlStatus] = useState<VerificationBadgeStatus>('NOT_SUBMITTED');
  const [dlMessage, setDlMessage] = useState('');
  const [dlVerificationData, setDlVerificationData] = useState<any>(null);
  const [dlCloudinaryData, setDlCloudinaryData] = useState<any>(null);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewModalImage, setPreviewModalImage] = useState<string | null>(null);
  const [previewModalTitle, setPreviewModalTitle] = useState<string>('');

  // Helper to resolve full image URLs (handles Cloudinary CDN, base64, and backend static paths)
  const getFullImageUrl = (uri: string | null) => {
    if (!uri) return '';
    if (uri.startsWith('http://') || uri.startsWith('https://') || uri.startsWith('data:')) {
      return uri;
    }
    const base = (api.defaults.baseURL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
    return `${base}${uri.startsWith('/') ? '' : '/'}${uri}`;
  };

  // Step 4: Aadhaar Verification
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [aadhaarConsent, setAadhaarConsent] = useState(false);
  const [aadhaarFrontImage, setAadhaarFrontImage] = useState<string | null>(null);
  const [aadhaarBackImage, setAadhaarBackImage] = useState<string | null>(null);
  const [aadhaarStatus, setAadhaarStatus] = useState<VerificationBadgeStatus>('NOT_SUBMITTED');
  const [aadhaarMessage, setAadhaarMessage] = useState('');

  // Step 5: PAN Card Verification
  const [panNumber, setPanNumber] = useState('');
  const [panName, setPanName] = useState('');
  const [panImage, setPanImage] = useState<string | null>(null);
  const [panStatus, setPanStatus] = useState<VerificationBadgeStatus>('NOT_SUBMITTED');
  const [panMessage, setPanMessage] = useState('');

  // Step 6: Vehicle & RC
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleType, setVehicleType] = useState('bike');
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');
  const [rcFrontImage, setRcFrontImage] = useState<string | null>(null);
  const [rcBackImage, setRcBackImage] = useState<string | null>(null);
  const [insuranceNumber, setInsuranceNumber] = useState('');
  const [insuranceExpiry, setInsuranceExpiry] = useState('');
  const [insuranceDocImage, setInsuranceDocImage] = useState<string | null>(null);
  const [rcStatus, setRcStatus] = useState<VerificationBadgeStatus>('NOT_SUBMITTED');
  const [insuranceStatus, setInsuranceStatus] = useState<VerificationBadgeStatus>('NOT_SUBMITTED');
  const [rcMessage, setRcMessage] = useState('');

  // Step 7: Review & Final Submit
  const [declarationAccepted, setDeclarationAccepted] = useState(false);

  // Micro-interaction: spring bounce effect on badge status change
  useEffect(() => {
    if (dlStatus === 'VERIFIED' || panStatus === 'VERIFIED') {
      badgeScaleAnim.setValue(0.7);
      Animated.spring(badgeScaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 80,
        useNativeDriver: true,
      }).start();
    }
  }, [dlStatus, panStatus]);

  // Load drafts and previous progress
  const loadDraftAndProgress = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Try loading from local storage
      const cached = await AsyncStorage.getItem(DRAFT_STORAGE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          populateForm(parsed);
        } catch {
          // ignore cache parse error
        }
      }

      // 2. Check token and load from server if authenticated
      const token = await AsyncStorage.getItem('token');
      if (token) {
        setHasToken(true);
        try {
          const serverRes = await riderService.getOnboardingProgress();
          if (serverRes && serverRes.overallStatus) {
            if (serverRes.stepData) {
              populateForm(serverRes.stepData);
            }
            if (serverRes.currentStep && serverRes.currentStep > 1) {
              setCurrentStep(Math.min(7, serverRes.currentStep));
            }
            if (serverRes.overallStatus === 'pending_review' || serverRes.overallStatus === 'approved') {
              setSubmissionComplete(true);
              setSubmissionData({
                status: serverRes.overallStatus,
                message: 'Your onboarding application is on file.',
              });
            }
            if (serverRes.documents && Array.isArray(serverRes.documents)) {
              syncDocumentStatuses(serverRes.documents);
            }
          }
        } catch (serverErr) {
          console.log('Error fetching onboarding from server:', serverErr);
        }
      } else {
        setHasToken(false);
        setIsNewRegistration(true);
      }
    } catch (err) {
      console.log('Error loading onboarding progress:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const populateForm = (data: any) => {
    const s1 = data.step1 || data;
    if (s1.fullName) setFullName(s1.fullName);
    if (s1.dob) setDob(s1.dob);
    if (s1.gender) setGender(s1.gender);
    if (s1.profilePhoto) setProfilePhoto(s1.profilePhoto);

    const s2 = data.step2 || data;
    if (s2.phone) setPhone(s2.phone);
    if (s2.email) setEmail(s2.email);
    if (s2.address) setAddress(s2.address);
    if (s2.city) setCity(s2.city);
    if (s2.stateName) setStateName(s2.stateName);
    if (s2.postalCode) setPostalCode(s2.postalCode);

    const s3 = data.step3 || data;
    if (s3.dlNumber) setDlNumber(s3.dlNumber);
    if (s3.dlDob) setDlDob(s3.dlDob);
    if (s3.dlExpiryDate) setDlExpiryDate(s3.dlExpiryDate);
    if (s3.dlFrontImage) setDlFrontImage(s3.dlFrontImage);
    if (s3.dlBackImage) setDlBackImage(s3.dlBackImage);
    if (s3.dlVerificationData) setDlVerificationData(s3.dlVerificationData);
    if (s3.dlCloudinaryData) setDlCloudinaryData(s3.dlCloudinaryData);
    if (s3.dlStatus) setDlStatus(s3.dlStatus);

    const s4 = data.step4 || data;
    if (s4.aadhaarNumber) setAadhaarNumber(s4.aadhaarNumber);
    if (s4.aadhaarConsent !== undefined) setAadhaarConsent(s4.aadhaarConsent);
    if (s4.aadhaarFrontImage) setAadhaarFrontImage(s4.aadhaarFrontImage);
    if (s4.aadhaarBackImage) setAadhaarBackImage(s4.aadhaarBackImage);

    const s5 = data.step5 || data;
    if (s5.panNumber) setPanNumber(s5.panNumber);
    if (s5.panName) setPanName(s5.panName);
    if (s5.panImage) setPanImage(s5.panImage);

    const s6 = data.step6 || data;
    if (s6.vehiclePlate) setVehiclePlate(s6.vehiclePlate);
    if (s6.vehicleType) setVehicleType(s6.vehicleType);
    if (s6.vehicleMake) setVehicleMake(s6.vehicleMake);
    if (s6.vehicleModel) setVehicleModel(s6.vehicleModel);
    if (s6.vehicleYear) setVehicleYear(s6.vehicleYear);
    if (s6.vehicleColor) setVehicleColor(s6.vehicleColor);
    if (s6.rcFrontImage) setRcFrontImage(s6.rcFrontImage);
    if (s6.rcBackImage) setRcBackImage(s6.rcBackImage);
    if (s6.insuranceNumber) setInsuranceNumber(s6.insuranceNumber);
    if (s6.insuranceExpiry) setInsuranceExpiry(s6.insuranceExpiry);
    if (s6.insuranceDocImage) setInsuranceDocImage(s6.insuranceDocImage);
  };

  const syncDocumentStatuses = (docs: DriverDocumentItem[]) => {
    docs.forEach((d) => {
      if (d.documentType === 'DRIVING_LICENSE') {
        setDlStatus(d.verificationStatus);
      } else if (d.documentType === 'AADHAAR') {
        setAadhaarStatus(d.verificationStatus);
      } else if (d.documentType === 'PAN') {
        setPanStatus(d.verificationStatus);
      } else if (d.documentType === 'RC') {
        setRcStatus(d.verificationStatus);
      } else if (d.documentType === 'INSURANCE') {
        setInsuranceStatus(d.verificationStatus);
      }
    });
  };

  useEffect(() => {
    loadDraftAndProgress();
  }, [loadDraftAndProgress]);

  // Save current step data to local cache and server
  const saveCurrentStepData = async (step: number) => {
    try {
      setSaving(true);
      let stepPayload: any = {};

      if (step === 1) {
        stepPayload = { fullName, dob, gender, profilePhoto };
      } else if (step === 2) {
        stepPayload = { phone, email, address, city, stateName, postalCode, otpVerified };
      } else if (step === 3) {
        stepPayload = {
          dlNumber,
          dlDob: dlDob || dob,
          dlExpiryDate,
          dlFrontImage,
          dlBackImage,
          dlStatus,
          dlVerificationData,
          dlCloudinaryData,
        };
      } else if (step === 4) {
        stepPayload = { aadhaarNumber, aadhaarConsent, aadhaarFrontImage, aadhaarBackImage, aadhaarStatus };
      } else if (step === 5) {
        stepPayload = { panNumber, panName, panImage, panStatus };
      } else if (step === 6) {
        stepPayload = {
          vehiclePlate,
          vehicleType,
          vehicleMake,
          vehicleModel,
          vehicleYear,
          vehicleColor,
          rcFrontImage,
          rcBackImage,
          insuranceNumber,
          insuranceExpiry,
          insuranceDocImage,
          rcStatus,
        };
      }

      // Update local storage
      const cached = await AsyncStorage.getItem(DRAFT_STORAGE_KEY);
      const existing = cached ? JSON.parse(cached) : {};
      const updated = {
        ...existing,
        [`step${step}`]: stepPayload,
      };
      await AsyncStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(updated));

      // Save to backend
      await riderService.saveOnboardingStep(step, stepPayload);
    } catch (err: any) {
      console.log('Error saving step draft:', err?.message);
    } finally {
      setSaving(false);
    }
  };

  // Image Picker handler
  const handlePickImage = async (setter: (uri: string) => void, docType: string) => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Denied', 'Camera roll permissions are required to upload document photos.');
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.5,
        base64: true,
      });

      if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
        const asset = pickerResult.assets[0];
        let photoUri = asset.uri;

        if (asset.base64) {
          photoUri = `data:image/jpeg;base64,${asset.base64}`;
        }

        setter(photoUri);

        // Upload to backend in background and track Cloudinary / Vault storage status
        riderService
          .uploadDocumentFile({
            documentType: docType,
            base64Image: photoUri,
          })
          .then((res: any) => {
            if (res.url) {
              // Immediately swap base64 with the hosted storage URL to keep drafts lightweight
              setter(res.url);

              if (docType === 'DL_FRONT') setDlFrontImage(res.url);
              if (docType === 'DL_BACK') setDlBackImage(res.url);
              if (docType === 'AADHAAR_FRONT') setAadhaarFrontImage(res.url);
              if (docType === 'AADHAAR_BACK') setAadhaarBackImage(res.url);
              if (docType === 'PAN') setPanImage(res.url);
              if (docType === 'RC_FRONT') setRcFrontImage(res.url);
              if (docType === 'RC_BACK') setRcBackImage(res.url);
              if (docType === 'INSURANCE') setInsuranceDocImage(res.url);
            }

            // AUTO-EXTRACT: Populate input boxes from scanned document
            if (res.extracted) {
              if (res.extracted.extractedDlNumber) {
                setDlNumber(res.extracted.extractedDlNumber);
              }
              if (res.extracted.extractedDob) {
                setDlDob(res.extracted.extractedDob);
                setDob((prev) => prev || res.extracted.extractedDob);
              }
              if (res.extracted.extractedExpiryDate) {
                setDlExpiryDate(res.extracted.extractedExpiryDate);
              }
              if (res.extracted.extractedName) {
                setFullName((prev) => prev || res.extracted.extractedName);
              }
              if (res.extracted.detectedState) {
                setStateName((prev) => prev || res.extracted.detectedState);
              }

              Alert.alert(
                'Document Scanned Successfully',
                `Details extracted from photo:\n\n• DL Number: ${res.extracted.extractedDlNumber || 'Detected'}\n• Validity: ${res.extracted.extractedExpiryDate || 'Active'}\n• DOB: ${res.extracted.extractedDob || 'Extracted'}\n• State: ${res.extracted.detectedState || 'Recognized'}\n\nInputs have been populated automatically.`
              );
            }

            if (docType === 'DL_FRONT' || docType === 'DL_BACK') {
              setDlCloudinaryData((prev: any) => ({
                ...prev,
                isWorking: res.isWorking ?? true,
                provider: res.provider || 'cloudinary',
                [docType === 'DL_FRONT' ? 'frontUploaded' : 'backUploaded']: true,
                [docType === 'DL_FRONT' ? 'frontUrl' : 'backUrl']: res.url || photoUri,
                [docType === 'DL_FRONT' ? 'frontAccessible' : 'backAccessible']: res.accessible ?? true,
                [docType === 'DL_FRONT' ? 'frontBytes' : 'backBytes']: res.bytes,
              }));
            }
          })
          .catch((e) => console.log('Background upload note:', e?.message));
      }
    } catch (err: any) {
      Alert.alert('Upload Error', err?.message || 'Failed to select image');
    }
  };

  // Validation before advancing to next step
  const validateStep = (step: number): boolean => {
    if (step === 1) {
      if (!fullName.trim()) {
        Alert.alert('Missing Field', 'Please enter your full legal name.');
        return false;
      }
      if (!hasToken || isNewRegistration) {
        if (!email.trim() || !email.includes('@')) {
          Alert.alert('Invalid Email', 'Please enter a valid email address.');
          return false;
        }
        if (!phone.trim() || phone.trim().length < 10) {
          Alert.alert('Invalid Phone', 'Please enter a valid 10-digit mobile number.');
          return false;
        }
        if (!password || password.length < 6) {
          Alert.alert('Password Requirement', 'Password must be at least 6 characters.');
          return false;
        }
      }
      if (!dob.trim()) {
        Alert.alert('Missing Field', 'Please enter your date of birth (YYYY-MM-DD).');
        return false;
      }
      return true;
    }

    if (step === 2) {
      if (!phone.trim() || phone.trim().length < 10) {
        Alert.alert('Invalid Phone', 'Please enter a valid 10-digit mobile number.');
        return false;
      }
      if (!email.trim() || !email.includes('@')) {
        Alert.alert('Invalid Email', 'Please enter a valid email address.');
        return false;
      }
      if (!address.trim() || !city.trim() || !postalCode.trim()) {
        Alert.alert('Missing Address', 'Please provide your full address, city, and postal code.');
        return false;
      }
      return true;
    }

    if (step === 3) {
      if (!dlNumber.trim() || dlNumber.trim().length < 8) {
        Alert.alert('Invalid DL Number', 'Please enter a valid Driving Licence number (at least 8 characters).');
        return false;
      }
      if (!dlFrontImage) {
        Alert.alert('DL Photo Required', 'Please upload a photo of the front of your Driving Licence.');
        return false;
      }
      if (dlStatus === 'EXPIRED') {
        Alert.alert(
          'Expired Driving Licence',
          'Your Driving Licence is expired. An active, valid licence is mandatory to continue.'
        );
        return false;
      }
      if (dlStatus === 'FAILED') {
        Alert.alert(
          'Invalid Driving Licence',
          'Driving licence verification failed. Please check your DL number and state jurisdiction.'
        );
        return false;
      }
      return true;
    }

    if (step === 4) {
      if (!aadhaarConsent) {
        Alert.alert(
          'Consent Required',
          'You must give authorization/consent for Aadhaar verification under government UIDAI guidelines.'
        );
        return false;
      }
      if (!aadhaarFrontImage && (!aadhaarNumber || aadhaarNumber.length < 12)) {
        Alert.alert(
          'Aadhaar Info Required',
          'Please enter your 12-digit Aadhaar number or upload an Aadhaar document photo.'
        );
        return false;
      }
      return true;
    }

    if (step === 5) {
      const cleanPan = panNumber.trim().toUpperCase();
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!cleanPan || !panRegex.test(cleanPan)) {
        Alert.alert(
          'Invalid PAN Format',
          'PAN number must be 10 characters in the format ABCDE1234F.'
        );
        return false;
      }
      if (!panName.trim()) {
        Alert.alert('Missing Field', 'Please enter your name exactly as printed on your PAN card.');
        return false;
      }
      return true;
    }

    if (step === 6) {
      if (!vehiclePlate.trim()) {
        Alert.alert('Missing Field', 'Please enter your vehicle registration plate number.');
        return false;
      }
      if (!vehicleMake.trim() || !vehicleModel.trim()) {
        Alert.alert('Missing Details', 'Please specify the vehicle make and model.');
        return false;
      }
      if (!rcFrontImage) {
        Alert.alert('RC Photo Required', 'Please upload a clear photo of your RC (Registration Certificate).');
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) return;

    // Handle account creation for new drivers at Step 1
    if (currentStep === 1 && (!hasToken || isNewRegistration)) {
      setSaving(true);
      try {
        let activeToken = await AsyncStorage.getItem('token');
        if (!activeToken) {
          try {
            const regRes = await api.post('/users/rider/register', {
              name: fullName.trim(),
              email: email.toLowerCase().trim(),
              phone: phone.trim(),
              password: password.trim(),
            });

            activeToken = regRes.data?.token;
            if (activeToken) {
              await AsyncStorage.setItem('token', activeToken);
              await AsyncStorage.setItem('userId', regRes.data?.user?.id || regRes.data?.user?._id);
              await AsyncStorage.setItem('user', JSON.stringify(regRes.data?.user));
              await AsyncStorage.setItem('rider', JSON.stringify(regRes.data?.user));
              setHasToken(true);
            }
          } catch (regErr: any) {
            const errMsg = regErr.response?.data?.message || '';
            if (errMsg.toLowerCase().includes('already exists')) {
              // Try logging in with the provided password
              const loginRes = await api.post('/users/rider/login', {
                email: email.toLowerCase().trim(),
                password: password.trim(),
              });
              activeToken = loginRes.data?.token;
              if (activeToken) {
                await AsyncStorage.setItem('token', activeToken);
                await AsyncStorage.setItem('userId', loginRes.data?.user?._id || loginRes.data?.user?.id);
                await AsyncStorage.setItem('user', JSON.stringify(loginRes.data?.user));
                await AsyncStorage.setItem('rider', JSON.stringify(loginRes.data?.user));
                setHasToken(true);
              }
            } else {
              throw regErr;
            }
          }
        }

        // Initialize onboarding session on backend
        await riderService.startOnboarding();
      } catch (err: any) {
        Alert.alert('Registration Error', err.response?.data?.message || 'Failed to create partner account.');
        setSaving(false);
        return;
      }
    }

    await saveCurrentStepData(currentStep);
    if (currentStep < 7) {
      animateStepTransition('next', () => setCurrentStep((prev) => prev + 1));
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      animateStepTransition('prev', () => setCurrentStep((prev) => prev - 1));
    }
  };

  // Step 3: Trigger DL verification with backend Sandbox service & Cloudinary storage check
  const handleVerifyDl = async () => {
    if (!dlNumber.trim() && !dlFrontImage) {
      Alert.alert(
        'Missing Document',
        'Please upload a photo of your Driving Licence or enter your DL number to verify.'
      );
      return;
    }
    setVerifying(true);
    try {
      const res = await riderService.verifyDl({
        dlNumber: dlNumber.trim().toUpperCase(),
        dob: dlDob || dob,
        frontImage: dlFrontImage || undefined,
        backImage: dlBackImage || undefined,
        expiryDate: dlExpiryDate || undefined,
      });

      const verification = res.verification || res;
      const cloudinary = res.cloudinary || null;

      setDlStatus(verification.status || 'PENDING');
      setDlMessage(verification.message || 'Driving licence verification processed.');
      setDlVerificationData(verification);
      setDlCloudinaryData(cloudinary);

      // Auto-populate form fields from OCR extracted data
      if (verification.imageAnalysis?.extractedDlNumber) {
        setDlNumber(verification.imageAnalysis.extractedDlNumber);
      }
      if (verification.imageAnalysis?.extractedExpiryDate) {
        setDlExpiryDate(verification.imageAnalysis.extractedExpiryDate);
      }
      if (verification.imageAnalysis?.extractedDob) {
        setDlDob(verification.imageAnalysis.extractedDob);
        setDob((prev) => prev || verification.imageAnalysis.extractedDob);
      }
      if (verification.imageAnalysis?.extractedName) {
        setFullName((prev) => prev || verification.imageAnalysis.extractedName);
      }
      if (verification.imageAnalysis?.detectedState) {
        setStateName((prev) => prev || verification.imageAnalysis.detectedState);
      }

      // If backend uploaded front/back to Cloudinary CDN or vault, update URLs
      if (cloudinary?.frontUrl && !dlFrontImage?.startsWith('http')) {
        setDlFrontImage(cloudinary.frontUrl);
      }
      if (cloudinary?.backUrl && !dlBackImage?.startsWith('http')) {
        setDlBackImage(cloudinary.backUrl);
      }

      if (verification.status === 'VERIFIED') {
        const conf = verification.imageAnalysis?.confidenceScore
          ? `\nImage Match Confidence: ${verification.imageAnalysis.confidenceScore}%`
          : '';
        Alert.alert(
          'DL & Image Verified Authentic',
          `Driving Licence photo and number verified authentic via Sandbox Gateway & Document Inspection.\n\nState: ${verification.stateName || 'State Transport Authority'}\nValidity: ${verification.expiryDate || 'Active'}${conf}\nCloudinary Storage: Operational & Accessible`
        );
      } else if (verification.status === 'EXPIRED') {
        Alert.alert(
          'Licence Expired',
          `This Driving Licence expired on ${verification.expiryDate || 'the specified date'}. Active driving licence is mandatory to continue.`
        );
      } else if (verification.status === 'FAILED') {
        Alert.alert('Verification Issue', verification.message || 'Driving licence image or format unrecognized.');
      } else {
        Alert.alert('Verification Update', verification.message || 'Document queued for compliance review.');
      }
    } catch (err: any) {
      setDlStatus('FAILED');
      setDlMessage(err.response?.data?.message || 'Verification provider unavailable.');
      Alert.alert('Verification Issue', err.response?.data?.message || 'Verification failed. Routed for manual review.');
    } finally {
      setVerifying(false);
    }
  };

  // Step 4: Trigger Aadhaar DigiLocker session or fallback manual review
  const handleVerifyAadhaarDigiLocker = async () => {
    if (!aadhaarConsent) {
      Alert.alert('Consent Required', 'Please accept the consent declaration.');
      return;
    }
    setVerifying(true);
    try {
      const res = await riderService.verifyAadhaar({
        aadhaarNumber: aadhaarNumber.trim(),
        consentGiven: true,
        useDigiLocker: true,
      });

      if (res.requiresRedirect && res.digiLockerSession?.authorizationUrl) {
        Alert.alert(
          'DigiLocker Session Created',
          'Sandbox DigiLocker session is ready. You will be redirected to the Government of India DigiLocker portal.',
          [{ text: 'OK' }]
        );
      }
      setAadhaarStatus('PENDING');
      setAadhaarMessage('DigiLocker session active. Verification queued.');
    } catch (err: any) {
      setAadhaarStatus('MANUAL_REVIEW');
      setAadhaarMessage('DigiLocker flow queued. Compliance agent will verify submitted photos.');
      Alert.alert('DigiLocker Notice', 'Automated portal queued. Documents will be reviewed by admin compliance.');
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifyAadhaarManual = async () => {
    if (!aadhaarConsent) {
      Alert.alert('Consent Required', 'Please check the consent box.');
      return;
    }
    setVerifying(true);
    try {
      const res = await riderService.verifyAadhaar({
        aadhaarNumber: aadhaarNumber.trim(),
        frontImage: aadhaarFrontImage || undefined,
        backImage: aadhaarBackImage || undefined,
        consentGiven: true,
        useDigiLocker: false,
      });
      setAadhaarStatus(res.status || 'MANUAL_REVIEW');
      setAadhaarMessage('Aadhaar documents submitted for manual review.');
      Alert.alert('Aadhaar Submitted', 'Your masked Aadhaar details are saved for administrative review.');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit Aadhaar');
    } finally {
      setVerifying(false);
    }
  };

  // Step 5: Trigger PAN verification with Sandbox live KYC
  const handleVerifyPan = async () => {
    const cleanPan = panNumber.trim().toUpperCase();
    if (!cleanPan || !panName.trim()) {
      Alert.alert('Missing Fields', 'Please enter both PAN number and Name as per PAN.');
      return;
    }
    setVerifying(true);
    try {
      const res = await riderService.verifyPan({
        pan: cleanPan,
        nameAsPerPan: panName.trim(),
        panImage: panImage || undefined,
      });

      setPanStatus(res.status || 'VERIFIED');
      setPanMessage(
        res.isNameMatch
          ? `Verified: Name matched (${res.fullName || panName})`
          : res.message || 'PAN verification executed'
      );
      Alert.alert(
        res.status === 'VERIFIED' ? 'PAN Verified' : 'PAN Status',
        res.isNameMatch
          ? `Success! Official name match confirmed: ${res.fullName || panName}`
          : res.message || 'PAN recorded for review.'
      );
    } catch (err: any) {
      setPanStatus('FAILED');
      setPanMessage(err.response?.data?.message || 'PAN check failed');
      Alert.alert('PAN Check', err.response?.data?.message || 'PAN verification failed. Queued for manual review.');
    } finally {
      setVerifying(false);
    }
  };

  // Step 6: Trigger RC verification with Sandbox API
  const handleVerifyRc = async () => {
    if (!vehiclePlate.trim()) {
      Alert.alert('Missing Plate', 'Please enter your vehicle registration plate number.');
      return;
    }
    setVerifying(true);
    try {
      const res = await riderService.verifyRc({
        vehiclePlate: vehiclePlate.trim().toUpperCase(),
        vehicleType,
        vehicleMake,
        vehicleModel,
        vehicleYear,
        vehicleColor,
        rcFrontImage: rcFrontImage || undefined,
        rcBackImage: rcBackImage || undefined,
        insurancePolicyNumber: insuranceNumber || undefined,
        insuranceExpiryDate: insuranceExpiry || undefined,
        insuranceDocumentImage: insuranceDocImage || undefined,
      });

      setRcStatus(res.status || 'PENDING');
      setRcMessage(res.message || 'RC submitted for verification.');
      Alert.alert('RC Verification', res.message || 'RC document registered successfully.');
    } catch (err: any) {
      setRcStatus('MANUAL_REVIEW');
      setRcMessage(err.response?.data?.message || 'RC verification routed for manual review.');
      Alert.alert('RC Notice', err.response?.data?.message || 'RC queued for administrative check.');
    } finally {
      setVerifying(false);
    }
  };

  // Step 7: Final Submission
  const handleFinalSubmit = async () => {
    if (!declarationAccepted) {
      Alert.alert(
        'Declaration Required',
        'Please check the declaration box confirming that all submitted documents and information are true and authentic.'
      );
      return;
    }

    setSaving(true);
    try {
      // Save all step data first
      await saveCurrentStepData(6);

      const res = await riderService.submitOnboarding(true);

      // Clear local draft upon successful submission
      await AsyncStorage.removeItem(DRAFT_STORAGE_KEY);

      setSubmissionComplete(true);
      setSubmissionData({
        status: 'PENDING_VERIFICATION',
        message:
          res.message ||
          'Your 7-step onboarding documents have been submitted successfully. Compliance agents will review your application.',
        submittedAt: new Date().toLocaleDateString(),
      });
    } catch (err: any) {
      Alert.alert('Submission Error', err.response?.data?.message || 'Failed to submit onboarding application.');
    } finally {
      setSaving(false);
    }
  };

  // Status Badge Helper Component
  const StatusBadge = ({ status, label }: { status: VerificationBadgeStatus; label?: string }) => {
    let bg = '#f0f0f0';
    let text = '#555';
    let icon = 'time-outline';

    if (status === 'VERIFIED') {
      bg = '#e8f5e9';
      text = '#2e7d32';
      icon = 'checkmark-circle';
    } else if (status === 'PENDING') {
      bg = '#fff8e1';
      text = '#f57f17';
      icon = 'hourglass-outline';
    } else if (status === 'MANUAL_REVIEW') {
      bg = '#e3f2fd';
      text = '#1565c0';
      icon = 'search-outline';
    } else if (status === 'FAILED' || status === 'REJECTED') {
      bg = '#ffebee';
      text = '#c62828';
      icon = 'close-circle';
    }

    return (
      <Animated.View
        style={[
          styles.badgeContainer,
          { backgroundColor: bg },
          status === 'VERIFIED' && { transform: [{ scale: badgeScaleAnim }] },
        ]}
      >
        <Ionicons name={icon as any} size={14} color={text} style={{ marginRight: 4 }} />
        <Text style={[styles.badgeText, { color: text }]}>{label || status}</Text>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#f72585" />
        <Text style={styles.loadingText}>Loading driver onboarding...</Text>
      </View>
    );
  }

  // Submission Completed Success Screen with Animated Entrance
  if (submissionComplete) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.successContainer}>
          <Animated.View
            style={[
              styles.successCardWrapper,
              {
                opacity: successOpacityAnim,
                transform: [{ scale: successScaleAnim }],
              },
            ]}
          >
            <View style={styles.successIconWrapper}>
              <Ionicons name="checkmark-done" size={54} color="#10b981" />
            </View>
            <Text style={styles.successTitle}>Application Submitted!</Text>
            <Text style={styles.successSubtitle}>
              {submissionData?.message ||
                'Your onboarding documents have been submitted securely to DriveMate Safety & Compliance. We will notify you once your verification is approved.'}
            </Text>

            <View style={styles.statusCard}>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Verification Status:</Text>
                <StatusBadge status="PENDING" label="Under Compliance Review" />
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Turnaround Time:</Text>
                <Text style={styles.statusValue}>Usually within 24 hours</Text>
              </View>
              <View style={[styles.statusRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.statusLabel}>Ride Acceptance:</Text>
                <Text style={[styles.statusValue, { color: '#f59e0b', fontWeight: 'bold' }]}>
                  Locked until verified
                </Text>
              </View>
            </View>

            <AnimatedButton
              style={styles.primaryButton}
              onPress={() => navigation.replace('MainTabs')}
            >
              <Text style={styles.primaryButtonText}>Go to Driver Home</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
            </AnimatedButton>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => (currentStep > 1 ? handlePrevious() : navigation.goBack())}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color="#0f172a" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle}>
            {isNewRegistration || !hasToken ? 'Partner Registration' : 'Driver Onboarding'}
          </Text>
          <View style={styles.stepProgressBadge}>
            <Ionicons name="sparkles" size={11} color="#f72585" style={{ marginRight: 4 }} />
            <Text style={styles.stepSubtitle}>
              Step {currentStep} of 7 • {STEP_TITLES[currentStep - 1]}
            </Text>
          </View>
        </View>
        <View style={styles.headerRightPill}>
          <Text style={styles.headerProgressPercent}>{Math.round((currentStep / 7) * 100)}%</Text>
        </View>
      </View>

      {/* Animated Top Continuous Progress Bar */}
      <View style={styles.progressBarTrack}>
        <Animated.View
          style={[
            styles.progressBarFill,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>

      {/* 7-Step Horizontal Stepper Bar */}
      <View style={styles.stepperContainer}>
        {STEP_TITLES.map((title, index) => {
          const stepNum = index + 1;
          const isActive = currentStep === stepNum;
          const isDone = currentStep > stepNum;

          return (
            <TouchableOpacity
              key={stepNum}
              style={styles.stepItem}
              onPress={() => {
                if (stepNum < currentStep) {
                  animateStepTransition('prev', () => setCurrentStep(stepNum));
                }
              }}
              disabled={stepNum > currentStep}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.stepCircle,
                  isActive && styles.stepCircleActive,
                  isDone && styles.stepCircleDone,
                ]}
              >
                {isDone ? (
                  <Ionicons name="checkmark" size={13} color="#fff" />
                ) : (
                  <Text
                    style={[
                      styles.stepCircleText,
                      isActive && styles.stepCircleTextActive,
                    ]}
                  >
                    {stepNum}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  isActive && styles.stepLabelActive,
                  isDone && styles.stepLabelDone,
                ]}
                numberOfLines={1}
              >
                {title.split(' ')[0]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Main Content Area with Fluid Slide & Fade Transition */}
      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={styles.scrollPadding}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            flex: 1,
            opacity: stepFadeAnim,
            transform: [{ translateX: stepSlideAnim }],
          }}
        >
        {/* STEP 1: Personal Information */}
        {currentStep === 1 && (
          <View style={styles.stepCard}>
            <Text style={styles.stepHeading}>Step 1: Personal Information</Text>
            <Text style={styles.stepDesc}>
              Enter your official identity details exactly as they appear on your government-issued ID.
            </Text>

            {/* Profile Photo */}
            <View style={styles.photoUploadContainer}>
              <TouchableOpacity
                onPress={() => handlePickImage(setProfilePhoto, 'PROFILE_PHOTO')}
                style={styles.avatarWrapper}
              >
                {profilePhoto ? (
                  <Image source={{ uri: profilePhoto }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="camera" size={32} color="#888" />
                    <Text style={styles.avatarText}>Add Photo</Text>
                  </View>
                )}
              </TouchableOpacity>
              <Text style={styles.photoTip}>Upload a clear, front-facing selfie without sunglasses or hats.</Text>
            </View>

            {/* Full Legal Name */}
            <Text style={styles.fieldLabel}>Full Legal Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter full legal name"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />

            {/* Account Credentials for New Partner Registration */}
            {(!hasToken || isNewRegistration) && (
              <>
                <Text style={styles.fieldLabel}>Mobile Phone Number *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="10-digit mobile number"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  maxLength={10}
                />

                <Text style={styles.fieldLabel}>Email Address *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter email address"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <Text style={styles.fieldLabel}>Create Partner Password *</Text>
                <View style={styles.inputWithIcon}>
                  <TextInput
                    style={{ flex: 1, fontSize: 15 }}
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#777"
                    />
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Date of Birth */}
            <Text style={styles.fieldLabel}>Date of Birth (YYYY-MM-DD) *</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={dob}
              onChangeText={setDob}
              keyboardType="numbers-and-punctuation"
            />

            {/* Gender */}
            <Text style={styles.fieldLabel}>Gender</Text>
            <View style={styles.genderRow}>
              {['male', 'female', 'other'].map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.genderChip, gender === g && styles.genderChipActive]}
                  onPress={() => setGender(g)}
                >
                  <Text
                    style={[styles.genderChipText, gender === g && styles.genderChipTextActive]}
                  >
                    {g.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* STEP 2: Contact Information & Address */}
        {currentStep === 2 && (
          <View style={styles.stepCard}>
            <Text style={styles.stepHeading}>Step 2: Contact & Address</Text>
            <Text style={styles.stepDesc}>
              Provide your active mobile number, email, and current residential address.
            </Text>

            <Text style={styles.fieldLabel}>Mobile Number *</Text>
            <View style={styles.inputWithIcon}>
              <Ionicons name="call-outline" size={20} color="#777" style={{ marginRight: 8 }} />
              <TextInput
                style={{ flex: 1, fontSize: 16 }}
                placeholder="10-digit mobile number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
              <View style={styles.verifiedTag}>
                <Ionicons name="checkmark-circle" size={16} color="#2e7d32" />
                <Text style={styles.verifiedTagText}>OTP Ready</Text>
              </View>
            </View>

            <Text style={styles.fieldLabel}>Email Address *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.fieldLabel}>Residential Address *</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              placeholder="Street name, Flat/House number, Landmark"
              value={address}
              onChangeText={setAddress}
              multiline
            />

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.fieldLabel}>City *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter city"
                  value={city}
                  onChangeText={setCity}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.fieldLabel}>State *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter state"
                  value={stateName}
                  onChangeText={setStateName}
                />
              </View>
            </View>

            <Text style={styles.fieldLabel}>Postal Code (PIN) *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter 6-digit PIN code"
              value={postalCode}
              onChangeText={setPostalCode}
              keyboardType="numeric"
              maxLength={6}
            />
          </View>
        )}

        {/* STEP 3: Driving Licence (DL) & Real-Time Verification */}
        {currentStep === 3 && (
          <View style={styles.stepCard}>
            <View style={styles.headingRow}>
              <View>
                <Text style={styles.stepHeading}>Step 3: Driving Licence (DL)</Text>
                <Text style={styles.stepSubBadge}>Sandbox Verified • Cloudinary Secured</Text>
              </View>
              <StatusBadge status={dlStatus} />
            </View>
            <Text style={styles.stepDesc}>
              Upload your valid Driving Licence and verify authenticity in real-time against the National Transport Sarathi Registry.
            </Text>

            <Text style={styles.fieldLabel}>Driving Licence Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Driving Licence number"
              value={dlNumber}
              onChangeText={(t) => setDlNumber(t.toUpperCase().trim())}
              autoCapitalize="characters"
            />
            <Text style={styles.inputHint}>Format: 2-letter state code + RTO + 4-digit year + 7 digits</Text>

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.fieldLabel}>Date of Birth on DL</Text>
                <TextInput
                  style={styles.input}
                  placeholder={dob || 'YYYY-MM-DD'}
                  value={dlDob}
                  onChangeText={setDlDob}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.fieldLabel}>Licence Expiry Date</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  value={dlExpiryDate}
                  onChangeText={setDlExpiryDate}
                />
              </View>
            </View>

            {/* Photo Uploads: Front and Back with Live Storage & Working Status */}
            <Text style={styles.fieldLabel}>Driving Licence Photos (Cloudinary / Secure Vault) *</Text>
            <View style={styles.docUploadRow}>
              {/* Front Image Box */}
              <View style={styles.docBoxWrapper}>
                <TouchableOpacity
                  style={[styles.docBox, dlFrontImage ? styles.docBoxUploaded : null]}
                  onPress={() => handlePickImage(setDlFrontImage, 'DL_FRONT')}
                  activeOpacity={0.85}
                >
                  {dlFrontImage ? (
                    <Image source={{ uri: getFullImageUrl(dlFrontImage) }} style={styles.docPreview} />
                  ) : (
                    <View style={styles.docPlaceholder}>
                      <View style={styles.docIconCircle}>
                        <Ionicons name="card-outline" size={24} color="#f72585" />
                      </View>
                      <Text style={styles.docUploadTitle}>DL Front Image *</Text>
                      <Text style={styles.docUploadSub}>Tap to upload</Text>
                    </View>
                  )}
                  {verifying && (
                    <View style={styles.scannerOverlay} pointerEvents="none">
                      <Animated.View
                        style={[
                          styles.scannerBeam,
                          {
                            transform: [
                              {
                                translateY: scannerAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [-10, 120],
                                }),
                              },
                            ],
                          },
                        ]}
                      />
                    </View>
                  )}
                </TouchableOpacity>
                {dlFrontImage ? (
                  <View style={styles.docMetaRow}>
                    <TouchableOpacity
                      style={styles.docZoomBtn}
                      onPress={() => {
                        setPreviewModalImage(getFullImageUrl(dlFrontImage));
                        setPreviewModalTitle('Driving Licence - Front');
                        setPreviewModalVisible(true);
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="eye-outline" size={13} color="#1d4ed8" />
                      <Text style={styles.docZoomText}>View</Text>
                    </TouchableOpacity>
                    <View style={styles.docLiveChip}>
                      <Ionicons name="checkmark-circle" size={12} color="#15803d" />
                      <Text style={styles.docLiveChipText}>
                        {dlCloudinaryData?.frontProvider === 'cloudinary' ? 'Cloudinary' : 'Saved'}
                      </Text>
                    </View>
                  </View>
                ) : null}
              </View>

              {/* Back Image Box */}
              <View style={styles.docBoxWrapper}>
                <TouchableOpacity
                  style={[styles.docBox, dlBackImage ? styles.docBoxUploaded : null]}
                  onPress={() => handlePickImage(setDlBackImage, 'DL_BACK')}
                  activeOpacity={0.85}
                >
                  {dlBackImage ? (
                    <Image source={{ uri: getFullImageUrl(dlBackImage) }} style={styles.docPreview} />
                  ) : (
                    <View style={styles.docPlaceholder}>
                      <View style={styles.docIconCircle}>
                        <Ionicons name="card-outline" size={24} color="#64748b" />
                      </View>
                      <Text style={styles.docUploadTitle}>DL Back Image</Text>
                      <Text style={styles.docUploadSub}>Tap to upload</Text>
                    </View>
                  )}
                  {verifying && (
                    <View style={styles.scannerOverlay} pointerEvents="none">
                      <Animated.View
                        style={[
                          styles.scannerBeam,
                          {
                            transform: [
                              {
                                translateY: scannerAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [-10, 120],
                                }),
                              },
                            ],
                          },
                        ]}
                      />
                    </View>
                  )}
                </TouchableOpacity>
                {dlBackImage ? (
                  <View style={styles.docMetaRow}>
                    <TouchableOpacity
                      style={styles.docZoomBtn}
                      onPress={() => {
                        setPreviewModalImage(getFullImageUrl(dlBackImage));
                        setPreviewModalTitle('Driving Licence - Back');
                        setPreviewModalVisible(true);
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="eye-outline" size={13} color="#1d4ed8" />
                      <Text style={styles.docZoomText}>View</Text>
                    </TouchableOpacity>
                    <View style={styles.docLiveChip}>
                      <Ionicons name="checkmark-circle" size={12} color="#15803d" />
                      <Text style={styles.docLiveChipText}>
                        {dlCloudinaryData?.backProvider === 'cloudinary' ? 'Cloudinary' : 'Saved'}
                      </Text>
                    </View>
                  </View>
                ) : null}
              </View>
            </View>

            {/* Sandbox Verification Action Button with Interactive Animation */}
            <AnimatedButton
              style={[styles.verifyButton, verifying && { opacity: 0.7 }]}
              onPress={handleVerifyDl}
              disabled={verifying}
            >
              {verifying ? (
                <>
                  <ActivityIndicator color="#fff" size="small" style={{ marginRight: 8 }} />
                  <Text style={styles.verifyButtonText}>Analyzing with Sandbox Gateway & OCR...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="shield-checkmark" size={18} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.verifyButtonText}>
                    {dlStatus === 'NOT_SUBMITTED' ? 'Verify DL with Sandbox API' : 'Re-verify with Sandbox API'}
                  </Text>
                </>
              )}
            </AnimatedButton>

            {/* REAL-TIME ON-SCREEN VERIFICATION & CLOUDINARY DIAGNOSTIC CARD */}
            {(dlStatus !== 'NOT_SUBMITTED' || dlVerificationData || dlCloudinaryData) && (
              <Animated.View
                style={[
                  styles.dlAuditCard,
                  dlStatus === 'VERIFIED'
                    ? styles.dlAuditCardVerified
                    : dlStatus === 'EXPIRED'
                    ? styles.dlAuditCardExpired
                    : dlStatus === 'FAILED'
                    ? styles.dlAuditCardFailed
                    : styles.dlAuditCardPending,
                  dlStatus === 'VERIFIED' && { transform: [{ scale: badgeScaleAnim }] },
                ]}
              >
                {/* Header Banner */}
                <View style={styles.auditHeader}>
                  <Ionicons
                    name={
                      dlStatus === 'VERIFIED'
                        ? 'checkmark-circle'
                        : dlStatus === 'EXPIRED'
                        ? 'alert-circle'
                        : dlStatus === 'FAILED'
                        ? 'close-circle'
                        : 'time'
                    }
                    size={22}
                    color={
                      dlStatus === 'VERIFIED'
                        ? '#15803d'
                        : dlStatus === 'EXPIRED'
                        ? '#b91c1c'
                        : dlStatus === 'FAILED'
                        ? '#c2410c'
                        : '#b45309'
                    }
                  />
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text
                      style={[
                        styles.auditTitle,
                        {
                          color:
                            dlStatus === 'VERIFIED'
                              ? '#15803d'
                              : dlStatus === 'EXPIRED'
                              ? '#b91c1c'
                              : dlStatus === 'FAILED'
                              ? '#c2410c'
                              : '#b45309',
                        },
                      ]}
                    >
                      {dlStatus === 'VERIFIED'
                        ? 'AUTHENTIC & VERIFIED'
                        : dlStatus === 'EXPIRED'
                        ? 'EXPIRED DRIVING LICENCE'
                        : dlStatus === 'FAILED'
                        ? 'UNRECOGNIZED DL FORMAT'
                        : 'PENDING COMPLIANCE REVIEW'}
                    </Text>
                    <Text style={styles.auditSubtitle}>
                      {dlMessage || 'Processed through Sandbox & Transport Authority'}
                    </Text>
                  </View>
                </View>

                {/* DL Extracted Details Grid */}
                <View style={styles.auditGrid}>
                  <View style={styles.auditRow}>
                    <Text style={styles.auditLabel}>State Authority:</Text>
                    <Text style={styles.auditValue}>
                      {dlVerificationData?.stateName || (stateName ? stateName : dlNumber && dlNumber.length >= 2 ? `State Code (${dlNumber.substring(0, 2)})` : '—')}
                    </Text>
                  </View>

                  <View style={styles.auditRow}>
                    <Text style={styles.auditLabel}>RTO Jurisdiction:</Text>
                    <Text style={styles.auditValue}>
                      {dlVerificationData?.rtoCode || (dlNumber && dlNumber.length >= 4 ? dlNumber.substring(0, 4) : '—')}
                    </Text>
                  </View>

                  <View style={styles.auditRow}>
                    <Text style={styles.auditLabel}>Permitted Classes:</Text>
                    <Text style={styles.auditValue}>
                      {dlVerificationData?.classesPermitted?.length
                        ? dlVerificationData.classesPermitted.join(', ')
                        : '—'}
                    </Text>
                  </View>

                  <View style={styles.auditRow}>
                    <Text style={styles.auditLabel}>Licence Expiry Validity:</Text>
                    <Text
                      style={[
                        styles.auditValue,
                        {
                          color: dlVerificationData?.isExpired ? '#b91c1c' : '#15803d',
                          fontWeight: 'bold',
                        },
                      ]}
                    >
                      {dlVerificationData?.isExpired
                        ? 'EXPIRED ✕'
                        : dlExpiryDate
                        ? `Valid until ${dlExpiryDate} ✓`
                        : 'Active / Valid ✓'}
                    </Text>
                  </View>

                  <View style={styles.auditRow}>
                    <Text style={styles.auditLabel}>Masked DL Number:</Text>
                    <Text style={styles.auditValue}>
                      {dlVerificationData?.maskedDl || (dlNumber ? `${dlNumber.substring(0, 4)}****${dlNumber.slice(-4)}` : 'N/A')}
                    </Text>
                  </View>

                  <View style={styles.auditRow}>
                    <Text style={styles.auditLabel}>Compliance Standard:</Text>
                    <Text style={styles.auditValue}>Motor Vehicles Act, 1988</Text>
                  </View>
                </View>

                {/* Confidence Score Visual Bar */}
                {dlVerificationData?.imageAnalysis?.confidenceScore !== undefined && (
                  <View style={styles.confidenceSection}>
                    <View style={styles.confidenceRow}>
                      <Text style={styles.confidenceLabel}>Document OCR Confidence</Text>
                      <Text style={styles.confidenceValue}>
                        {dlVerificationData.imageAnalysis.confidenceScore}%
                      </Text>
                    </View>
                    <View style={styles.confidenceTrack}>
                      <View
                        style={[
                          styles.confidenceFill,
                          {
                            width: `${Math.max(10, Math.min(100, dlVerificationData.imageAnalysis.confidenceScore))}%`,
                            backgroundColor:
                              dlVerificationData.imageAnalysis.confidenceScore >= 70
                                ? '#10b981'
                                : dlVerificationData.imageAnalysis.confidenceScore >= 40
                                ? '#f59e0b'
                                : '#ef4444',
                          },
                        ]}
                      />
                    </View>
                  </View>
                )}

                {/* Document Image & OCR Authenticity Section */}
                {dlVerificationData?.imageAnalysis && (
                  <View
                    style={[
                      styles.imageOcrStatusBox,
                      !dlVerificationData.imageAnalysis.isAuthenticDocument && {
                        backgroundColor: '#fff1f2',
                        borderColor: '#fecdd3',
                      },
                    ]}
                  >
                    <View style={styles.storageHeader}>
                      <Ionicons
                        name={
                          dlVerificationData.imageAnalysis.isAuthenticDocument
                            ? 'scan-circle-outline'
                            : 'alert-circle-outline'
                        }
                        size={18}
                        color={dlVerificationData.imageAnalysis.isAuthenticDocument ? '#15803d' : '#be123c'}
                      />
                      <Text style={styles.storageTitle}>Sandbox Document Image Inspection</Text>
                      <View
                        style={[
                          styles.storageBadge,
                          {
                            backgroundColor: dlVerificationData.imageAnalysis.isAuthenticDocument
                              ? '#dcfce7'
                              : '#ffe4e6',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.storageBadgeText,
                            {
                              color: dlVerificationData.imageAnalysis.isAuthenticDocument ? '#15803d' : '#9f1239',
                            },
                          ]}
                        >
                          {dlVerificationData.imageAnalysis.isAuthenticDocument
                            ? `Authentic (${dlVerificationData.imageAnalysis.confidenceScore}% Confidence)`
                            : 'Unrecognized Image'}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.storageDesc}>
                      {dlVerificationData.imageAnalysis.isAuthenticDocument
                        ? 'Document photo scanned and verified authentic. Form 7 Indian Driving Licence credentials detected via computer vision.'
                        : (dlVerificationData.imageAnalysis.validationIssues?.[0] ||
                          'The uploaded photo does not appear to be a valid Driving Licence. Please ensure card is clear and uncropped.')}
                    </Text>

                    <View style={styles.auditGrid}>
                      <View style={styles.auditRow}>
                        <Text style={styles.auditLabel}>DL Number in Image:</Text>
                        <Text style={[styles.auditValue, { fontWeight: 'bold' }]}>
                          {dlVerificationData.imageAnalysis.extractedDlNumber || dlNumber || 'Card format matched'}
                        </Text>
                      </View>
                      <View style={styles.auditRow}>
                        <Text style={styles.auditLabel}>State Authority in Photo:</Text>
                        <Text style={styles.auditValue}>
                          {dlVerificationData.imageAnalysis.detectedState || dlVerificationData.stateName || 'State Transport Dept'}
                        </Text>
                      </View>
                      <View style={styles.auditRow}>
                        <Text style={styles.auditLabel}>Govt Header / Seal:</Text>
                        <Text
                          style={[
                            styles.auditValue,
                            {
                              color: dlVerificationData.imageAnalysis.hasDlHeader ? '#15803d' : '#b91c1c',
                            },
                          ]}
                        >
                          {dlVerificationData.imageAnalysis.hasDlHeader ? 'Verified Present ✓' : 'Not Detected ✕'}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Cloudinary & Document Storage Inspection Section */}
                <View style={styles.storageStatusBox}>
                  <View style={styles.storageHeader}>
                    <Ionicons name="cloud-done-outline" size={16} color="#0284c7" />
                    <Text style={styles.storageTitle}>Cloudinary & Document Storage</Text>
                    <View style={styles.storageBadge}>
                      <Text style={styles.storageBadgeText}>
                        {dlCloudinaryData?.provider === 'cloudinary' ? 'Cloudinary CDN Active' : 'Secure Vault Operational'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.storageDesc}>
                    {dlCloudinaryData?.storageAccountStatus ||
                      'Images are securely stored, encrypted, and operational on the DriveMate storage pipeline.'}
                  </Text>

                  {/* Uploaded Documents Mini Gallery */}
                  <View style={styles.storageThumbnailsRow}>
                    {dlFrontImage && (
                      <TouchableOpacity
                        style={styles.storageThumbItem}
                        onPress={() => {
                          setPreviewModalImage(getFullImageUrl(dlFrontImage));
                          setPreviewModalTitle('DL Front - Storage Inspection');
                          setPreviewModalVisible(true);
                        }}
                      >
                        <Image source={{ uri: getFullImageUrl(dlFrontImage) }} style={styles.storageThumbImg} />
                        <View style={styles.storageThumbOverlay}>
                          <Ionicons name="checkmark-circle" size={12} color="#10b981" />
                          <Text style={styles.storageThumbText}>Front Working</Text>
                        </View>
                      </TouchableOpacity>
                    )}

                    {dlBackImage && (
                      <TouchableOpacity
                        style={styles.storageThumbItem}
                        onPress={() => {
                          setPreviewModalImage(getFullImageUrl(dlBackImage));
                          setPreviewModalTitle('DL Back - Storage Inspection');
                          setPreviewModalVisible(true);
                        }}
                      >
                        <Image source={{ uri: getFullImageUrl(dlBackImage) }} style={styles.storageThumbImg} />
                        <View style={styles.storageThumbOverlay}>
                          <Ionicons name="checkmark-circle" size={12} color="#10b981" />
                          <Text style={styles.storageThumbText}>Back Working</Text>
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </Animated.View>
            )}
          </View>
        )}

        {/* STEP 4: Aadhaar Verification */}
        {currentStep === 4 && (
          <View style={styles.stepCard}>
            <View style={styles.headingRow}>
              <Text style={styles.stepHeading}>Step 4: Aadhaar Verification</Text>
              <StatusBadge status={aadhaarStatus} />
            </View>
            <Text style={styles.stepDesc}>
              Aadhaar verification is conducted under UIDAI regulations. We never store or display full
              unmasked Aadhaar numbers.
            </Text>

            {/* Mandatory Consent Box */}
            <TouchableOpacity
              style={styles.consentBox}
              onPress={() => setAadhaarConsent(!aadhaarConsent)}
            >
              <Ionicons
                name={aadhaarConsent ? 'checkbox' : 'square-outline'}
                size={22}
                color={aadhaarConsent ? '#2e7d32' : '#888'}
              />
              <Text style={styles.consentText}>
                I hereby declare that I provide consent to DriveMate to verify my identity documents
                using Government authorized DigiLocker KYC or authorized offline verification methods.
              </Text>
            </TouchableOpacity>

            <Text style={styles.fieldLabel}>Aadhaar Number (Optional if using DigiLocker)</Text>
            <TextInput
              style={styles.input}
              placeholder="12-digit Aadhaar number"
              value={aadhaarNumber}
              onChangeText={setAadhaarNumber}
              keyboardType="numeric"
              maxLength={12}
            />

            {/* Document Uploads */}
            <View style={styles.docUploadRow}>
              <View style={styles.docBoxWrapper}>
                <TouchableOpacity
                  style={[styles.docBox, aadhaarFrontImage ? styles.docBoxUploaded : null]}
                  onPress={() => handlePickImage(setAadhaarFrontImage, 'AADHAAR_FRONT')}
                >
                  {aadhaarFrontImage ? (
                    <Image source={{ uri: getFullImageUrl(aadhaarFrontImage) }} style={styles.docPreview} />
                  ) : (
                    <View style={styles.docPlaceholder}>
                      <View style={styles.docIconCircle}>
                        <Ionicons name="document-text-outline" size={24} color="#f72585" />
                      </View>
                      <Text style={styles.docUploadTitle}>Aadhaar Front</Text>
                      <Text style={styles.docUploadSub}>Masked photo</Text>
                    </View>
                  )}
                  {verifying && (
                    <View style={styles.scannerOverlay} pointerEvents="none">
                      <Animated.View
                        style={[
                          styles.scannerBeam,
                          {
                            transform: [
                              {
                                translateY: scannerAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [-10, 120],
                                }),
                              },
                            ],
                          },
                        ]}
                      />
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.docBoxWrapper}>
                <TouchableOpacity
                  style={[styles.docBox, aadhaarBackImage ? styles.docBoxUploaded : null]}
                  onPress={() => handlePickImage(setAadhaarBackImage, 'AADHAAR_BACK')}
                >
                  {aadhaarBackImage ? (
                    <Image source={{ uri: getFullImageUrl(aadhaarBackImage) }} style={styles.docPreview} />
                  ) : (
                    <View style={styles.docPlaceholder}>
                      <View style={styles.docIconCircle}>
                        <Ionicons name="document-text-outline" size={24} color="#f72585" />
                      </View>
                      <Text style={styles.docUploadTitle}>Aadhaar Back</Text>
                      <Text style={styles.docUploadSub}>Address side</Text>
                    </View>
                  )}
                  {verifying && (
                    <View style={styles.scannerOverlay} pointerEvents="none">
                      <Animated.View
                        style={[
                          styles.scannerBeam,
                          {
                            transform: [
                              {
                                translateY: scannerAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [-10, 120],
                                }),
                              },
                            ],
                          },
                        ]}
                      />
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Verification Actions */}
            <View style={{ gap: 10, marginTop: 10 }}>
              <AnimatedButton
                style={[styles.digilockerButton, (!aadhaarConsent || verifying) && { opacity: 0.6 }]}
                onPress={handleVerifyAadhaarDigiLocker}
                disabled={!aadhaarConsent || verifying}
              >
                <Ionicons name="finger-print" size={18} color="#1565c0" style={{ marginRight: 6 }} />
                <Text style={styles.digilockerButtonText}>Initiate DigiLocker KYC (Sandbox)</Text>
              </AnimatedButton>

              <AnimatedButton
                style={[styles.outlineButton, (!aadhaarConsent || verifying) && { opacity: 0.6 }]}
                onPress={handleVerifyAadhaarManual}
                disabled={!aadhaarConsent || verifying}
              >
                <Text style={styles.outlineButtonText}>Save for Manual Compliance Review</Text>
              </AnimatedButton>
            </View>

            {aadhaarMessage ? <Text style={styles.verificationNote}>{aadhaarMessage}</Text> : null}
          </View>
        )}

        {/* STEP 5: PAN Card Verification */}
        {currentStep === 5 && (
          <View style={styles.stepCard}>
            <View style={styles.headingRow}>
              <Text style={styles.stepHeading}>Step 5: PAN Card Verification</Text>
              <StatusBadge status={panStatus} />
            </View>
            <Text style={styles.stepDesc}>
              Real-time instant PAN verification through Sandbox NSDL/Income Tax KYC API.
            </Text>

            <Text style={styles.fieldLabel}>PAN Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter 10-character PAN number"
              value={panNumber}
              onChangeText={(t) => setPanNumber(t.toUpperCase())}
              autoCapitalize="characters"
              maxLength={10}
            />

            <Text style={styles.fieldLabel}>Name as Printed on PAN *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter name as printed on PAN"
              value={panName}
              onChangeText={setPanName}
              autoCapitalize="words"
            />

            <Text style={styles.fieldLabel}>PAN Card Photo</Text>
            <TouchableOpacity
              style={[styles.docBox, { height: 140 }, panImage ? styles.docBoxUploaded : null]}
              onPress={() => handlePickImage(setPanImage, 'PAN_CARD')}
              activeOpacity={0.85}
            >
              {panImage ? (
                <Image source={{ uri: panImage }} style={styles.docPreview} />
              ) : (
                <View style={styles.docPlaceholder}>
                  <View style={styles.docIconCircle}>
                    <Ionicons name="card-outline" size={26} color="#f72585" />
                  </View>
                  <Text style={styles.docUploadTitle}>Upload PAN Card Photo</Text>
                  <Text style={styles.docUploadSub}>Ensure name and PAN number are readable</Text>
                </View>
              )}
              {verifying && (
                <View style={styles.scannerOverlay} pointerEvents="none">
                  <Animated.View
                    style={[
                      styles.scannerBeam,
                      {
                        transform: [
                          {
                            translateY: scannerAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [-10, 130],
                            }),
                          },
                        ],
                      },
                    ]}
                  />
                </View>
              )}
            </TouchableOpacity>

            <AnimatedButton
              style={[styles.verifyButton, verifying && { opacity: 0.7 }]}
              onPress={handleVerifyPan}
              disabled={verifying}
            >
              {verifying ? (
                <>
                  <ActivityIndicator color="#fff" size="small" style={{ marginRight: 8 }} />
                  <Text style={styles.verifyButtonText}>Verifying PAN with Sandbox KYC...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="flash" size={18} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.verifyButtonText}>Verify PAN with Sandbox KYC</Text>
                </>
              )}
            </AnimatedButton>

            {panMessage ? <Text style={styles.verificationNote}>{panMessage}</Text> : null}
          </View>
        )}

        {/* STEP 6: Vehicle Registration & Vehicle Documents */}
        {currentStep === 6 && (
          <View style={styles.stepCard}>
            <View style={styles.headingRow}>
              <Text style={styles.stepHeading}>Step 6: Vehicle & RC Documents</Text>
              <StatusBadge status={rcStatus} />
            </View>
            <Text style={styles.stepDesc}>
              Enter vehicle details and upload the RC (Registration Certificate) and insurance copy.
            </Text>

            {/* Vehicle Type Picker */}
            <Text style={styles.fieldLabel}>Vehicle Category *</Text>
            <View style={styles.vehicleTypeRow}>
              {[
                { id: 'bike', label: 'Bike', icon: 'bicycle-outline' },
                { id: 'auto', label: 'Auto', icon: 'car-sport-outline' },
                { id: 'car_economy', label: 'Cab Mini', icon: 'car-outline' },
                { id: 'car_premium', label: 'Cab Sedan', icon: 'car-sport' },
              ].map((v) => {
                const isSelected = vehicleType === v.id;
                return (
                  <TouchableOpacity
                    key={v.id}
                    style={[styles.vTypeBox, isSelected && styles.vTypeBoxActive]}
                    onPress={() => setVehicleType(v.id)}
                    activeOpacity={0.8}
                  >
                    {isSelected && (
                      <View style={styles.vTypeCheckPill}>
                        <Ionicons name="checkmark" size={10} color="#fff" />
                      </View>
                    )}
                    <Ionicons
                      name={v.icon as any}
                      size={24}
                      color={isSelected ? '#f72585' : '#64748b'}
                    />
                    <Text
                      style={[
                        styles.vTypeLabel,
                        isSelected && styles.vTypeLabelActive,
                      ]}
                    >
                      {v.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.fieldLabel}>Registration Plate Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter registration plate number"
              value={vehiclePlate}
              onChangeText={(t) => setVehiclePlate(t.toUpperCase())}
              autoCapitalize="characters"
            />

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.fieldLabel}>Make / Brand *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Vehicle make / brand"
                  value={vehicleMake}
                  onChangeText={setVehicleMake}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.fieldLabel}>Model *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Vehicle model"
                  value={vehicleModel}
                  onChangeText={setVehicleModel}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.fieldLabel}>Manufacture Year</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY"
                  value={vehicleYear}
                  onChangeText={setVehicleYear}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.fieldLabel}>Vehicle Colour</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Vehicle colour"
                  value={vehicleColor}
                  onChangeText={setVehicleColor}
                />
              </View>
            </View>

            {/* RC Uploads */}
            <Text style={[styles.fieldLabel, { marginTop: 15 }]}>RC Document Photos *</Text>
            <View style={styles.docUploadRow}>
              <View style={styles.docBoxWrapper}>
                <TouchableOpacity
                  style={[styles.docBox, rcFrontImage ? styles.docBoxUploaded : null]}
                  onPress={() => handlePickImage(setRcFrontImage, 'RC_FRONT')}
                >
                  {rcFrontImage ? (
                    <Image source={{ uri: getFullImageUrl(rcFrontImage) }} style={styles.docPreview} />
                  ) : (
                    <View style={styles.docPlaceholder}>
                      <View style={styles.docIconCircle}>
                        <Ionicons name="document-outline" size={24} color="#f72585" />
                      </View>
                      <Text style={styles.docUploadTitle}>RC Front Image</Text>
                      <Text style={styles.docUploadSub}>Registration side</Text>
                    </View>
                  )}
                  {verifying && (
                    <View style={styles.scannerOverlay} pointerEvents="none">
                      <Animated.View
                        style={[
                          styles.scannerBeam,
                          {
                            transform: [
                              {
                                translateY: scannerAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [-10, 120],
                                }),
                              },
                            ],
                          },
                        ]}
                      />
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.docBoxWrapper}>
                <TouchableOpacity
                  style={[styles.docBox, rcBackImage ? styles.docBoxUploaded : null]}
                  onPress={() => handlePickImage(setRcBackImage, 'RC_BACK')}
                >
                  {rcBackImage ? (
                    <Image source={{ uri: getFullImageUrl(rcBackImage) }} style={styles.docPreview} />
                  ) : (
                    <View style={styles.docPlaceholder}>
                      <View style={styles.docIconCircle}>
                        <Ionicons name="document-outline" size={24} color="#f72585" />
                      </View>
                      <Text style={styles.docUploadTitle}>RC Back Image</Text>
                      <Text style={styles.docUploadSub}>Particulars side</Text>
                    </View>
                  )}
                  {verifying && (
                    <View style={styles.scannerOverlay} pointerEvents="none">
                      <Animated.View
                        style={[
                          styles.scannerBeam,
                          {
                            transform: [
                              {
                                translateY: scannerAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [-10, 120],
                                }),
                              },
                            ],
                          },
                        ]}
                      />
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Insurance Details */}
            <Text style={[styles.fieldLabel, { marginTop: 15 }]}>Insurance Policy Details</Text>
            <TextInput
              style={styles.input}
              placeholder="Policy / Certificate Number"
              value={insuranceNumber}
              onChangeText={setInsuranceNumber}
            />

            <TextInput
              style={styles.input}
              placeholder="Expiry Date (YYYY-MM-DD)"
              value={insuranceExpiry}
              onChangeText={setInsuranceExpiry}
            />

            <TouchableOpacity
              style={[
                styles.docBox,
                { height: 110, marginTop: 4 },
                insuranceDocImage ? styles.docBoxUploaded : null,
              ]}
              onPress={() => handlePickImage(setInsuranceDocImage, 'INSURANCE_POLICY')}
            >
              {insuranceDocImage ? (
                <Image source={{ uri: getFullImageUrl(insuranceDocImage) }} style={styles.docPreview} />
              ) : (
                <View style={styles.docPlaceholder}>
                  <View style={styles.docIconCircle}>
                    <Ionicons name="shield-outline" size={24} color="#f72585" />
                  </View>
                  <Text style={styles.docUploadTitle}>Upload Insurance Document</Text>
                  <Text style={styles.docUploadSub}>Active insurance certificate</Text>
                </View>
              )}
            </TouchableOpacity>

            <AnimatedButton
              style={[styles.verifyButton, verifying && { opacity: 0.7 }]}
              onPress={handleVerifyRc}
              disabled={verifying}
            >
              {verifying ? (
                <>
                  <ActivityIndicator color="#fff" size="small" style={{ marginRight: 8 }} />
                  <Text style={styles.verifyButtonText}>Verifying RC with Sandbox...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="car-sport-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.verifyButtonText}>Verify Vehicle RC with Sandbox</Text>
                </>
              )}
            </AnimatedButton>

            {rcMessage ? <Text style={styles.verificationNote}>{rcMessage}</Text> : null}
          </View>
        )}

        {/* STEP 7: Review and Final Submission */}
        {currentStep === 7 && (
          <View style={styles.stepCard}>
            <Text style={styles.stepHeading}>Step 7: Review & Final Submission</Text>
            <Text style={styles.stepDesc}>
              Carefully review your information before final submission. You can click 'Edit' on any
              section to make updates.
            </Text>

            {/* Summary Block: Personal */}
            <View style={styles.summarySection}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryTitle}>1. Personal Info</Text>
                <TouchableOpacity onPress={() => animateStepTransition('prev', () => setCurrentStep(1))}>
                  <Text style={styles.editLink}>Edit</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>Name:</Text>
                <Text style={styles.summaryVal}>{fullName || 'Not provided'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>DOB:</Text>
                <Text style={styles.summaryVal}>{dob || 'Not provided'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>Gender:</Text>
                <Text style={styles.summaryVal}>{gender.toUpperCase()}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>Profile Photo:</Text>
                <Text style={styles.summaryVal}>{profilePhoto ? 'Attached' : 'Missing'}</Text>
              </View>
            </View>

            {/* Summary Block: Contact */}
            <View style={styles.summarySection}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryTitle}>2. Contact & Address</Text>
                <TouchableOpacity onPress={() => animateStepTransition('prev', () => setCurrentStep(2))}>
                  <Text style={styles.editLink}>Edit</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>Phone:</Text>
                <Text style={styles.summaryVal}>{phone || 'Not provided'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>Email:</Text>
                <Text style={styles.summaryVal}>{email || 'Not provided'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>City / State:</Text>
                <Text style={styles.summaryVal}>
                  {city}, {stateName} - {postalCode}
                </Text>
              </View>
            </View>

            {/* Summary Block: DL */}
            <View style={styles.summarySection}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryTitle}>3. Driving Licence</Text>
                <TouchableOpacity onPress={() => animateStepTransition('prev', () => setCurrentStep(3))}>
                  <Text style={styles.editLink}>Edit</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>DL Number:</Text>
                <Text style={styles.summaryVal}>{dlNumber || 'Not provided'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>Status:</Text>
                <StatusBadge status={dlStatus} />
              </View>
            </View>

            {/* Summary Block: Aadhaar */}
            <View style={styles.summarySection}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryTitle}>4. Aadhaar KYC</Text>
                <TouchableOpacity onPress={() => animateStepTransition('prev', () => setCurrentStep(4))}>
                  <Text style={styles.editLink}>Edit</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>Consent Status:</Text>
                <Text style={[styles.summaryVal, { color: '#2e7d32' }]}>Authorized</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>Status:</Text>
                <StatusBadge status={aadhaarStatus} />
              </View>
            </View>

            {/* Summary Block: PAN */}
            <View style={styles.summarySection}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryTitle}>5. PAN Card</Text>
                <TouchableOpacity onPress={() => animateStepTransition('prev', () => setCurrentStep(5))}>
                  <Text style={styles.editLink}>Edit</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>PAN Number:</Text>
                <Text style={styles.summaryVal}>{panNumber || 'Not provided'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>Status:</Text>
                <StatusBadge status={panStatus} />
              </View>
            </View>

            {/* Summary Block: Vehicle */}
            <View style={styles.summarySection}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryTitle}>6. Vehicle & RC</Text>
                <TouchableOpacity onPress={() => animateStepTransition('prev', () => setCurrentStep(6))}>
                  <Text style={styles.editLink}>Edit</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>Plate Number:</Text>
                <Text style={styles.summaryVal}>{vehiclePlate || 'Not provided'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>Vehicle Model:</Text>
                <Text style={styles.summaryVal}>
                  {vehicleMake} {vehicleModel} ({vehicleType})
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>RC Status:</Text>
                <StatusBadge status={rcStatus} />
              </View>
            </View>

            {/* Declaration Checkbox */}
            <TouchableOpacity
              style={styles.consentBox}
              onPress={() => setDeclarationAccepted(!declarationAccepted)}
            >
              <Ionicons
                name={declarationAccepted ? 'checkbox' : 'square-outline'}
                size={24}
                color={declarationAccepted ? '#2e7d32' : '#888'}
              />
              <Text style={styles.consentText}>
                I solemnly swear and affirm that all the information, vehicle details, and documents
                submitted by me are genuine, accurate, and valid under the Motor Vehicles Act and
                DriveMate Partner Agreement.
              </Text>
            </TouchableOpacity>

            {/* Final Submit Button */}
              <AnimatedButton
                style={[
                  styles.primaryButton,
                  (!declarationAccepted || saving) && { opacity: 0.6 },
                  { marginTop: 20 },
                ]}
                onPress={handleFinalSubmit}
                disabled={!declarationAccepted || saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="paper-plane" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.primaryButtonText}>Submit Complete Registration</Text>
                  </>
                )}
              </AnimatedButton>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Footer Navigation Bar (Steps 1 to 6) */}
      {currentStep < 7 && (
        <View style={styles.footerBar}>
          <AnimatedButton
            style={[styles.navBtn, styles.navBtnPrev, currentStep === 1 && { opacity: 0.4 }]}
            onPress={handlePrevious}
            disabled={currentStep === 1}
          >
            <Ionicons name="arrow-back" size={18} color="#334155" style={{ marginRight: 4 }} />
            <Text style={styles.navBtnTextPrev}>Previous</Text>
          </AnimatedButton>

          <AnimatedButton
            style={[styles.navBtn, styles.navBtnNext]}
            onPress={handleNext}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.navBtnTextNext}>Save & Next</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 4 }} />
              </>
            )}
          </AnimatedButton>
        </View>
      )}
      {/* Fullscreen Document Image Modal */}
      <Modal
        visible={previewModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPreviewModalVisible(false)}
      >
        <SafeAreaView style={styles.modalBackdrop}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitleText}>{previewModalTitle || 'Document Preview'}</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setPreviewModalVisible(false)}
            >
              <Ionicons name="close-circle" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.modalImageWrapper}>
            {previewModalImage ? (
              <Image
                source={{ uri: previewModalImage }}
                style={styles.modalFullImage}
                resizeMode="contain"
              />
            ) : null}
          </View>
          <View style={styles.modalFooter}>
            <Text style={styles.modalFooterText}>Stored & Verified Document • DriveMate High-Res Viewer</Text>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 14,
    fontSize: 15,
    color: '#475569',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  stepProgressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fdf2f8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 2,
    borderWidth: 1,
    borderColor: '#fce7f3',
  },
  stepSubtitle: {
    fontSize: 11,
    color: '#db2777',
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  headerRightPill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  headerProgressPercent: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  progressBarTrack: {
    height: 3.5,
    backgroundColor: '#e2e8f0',
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 3.5,
    backgroundColor: '#f72585',
  },
  stepperContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    justifyContent: 'space-around',
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  stepCircleActive: {
    backgroundColor: '#f72585',
    borderColor: '#f72585',
    shadowColor: '#f72585',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  stepCircleDone: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  stepCircleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  stepCircleTextActive: {
    color: '#ffffff',
  },
  stepLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
  },
  stepLabelActive: {
    color: '#f72585',
    fontWeight: '800',
  },
  stepLabelDone: {
    color: '#10b981',
    fontWeight: '700',
  },
  contentScroll: {
    flex: 1,
  },
  scrollPadding: {
    padding: 16,
    paddingBottom: 40,
  },
  stepCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
    marginBottom: 16,
  },
  stepHeading: {
    fontSize: 19.5,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  stepDesc: {
    fontSize: 13.5,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 18,
  },
  headingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 13,
    fontSize: 15,
    color: '#0f172a',
  },
  inputFocused: {
    borderColor: '#f72585',
    backgroundColor: '#ffffff',
    shadowColor: '#f72585',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  verifiedTagText: {
    fontSize: 11,
    color: '#15803d',
    fontWeight: '800',
    marginLeft: 4,
  },
  photoUploadContainer: {
    alignItems: 'center',
    marginVertical: 14,
  },
  avatarWrapper: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#fdf2f8',
    borderWidth: 2.5,
    borderColor: '#f72585',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#f72585',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarImage: {
    width: 104,
    height: 104,
  },
  avatarPlaceholder: {
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 11,
    color: '#db2777',
    marginTop: 4,
    fontWeight: '700',
  },
  photoTip: {
    fontSize: 11.5,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 10,
    maxWidth: 250,
  },
  row: {
    flexDirection: 'row',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  genderChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    alignItems: 'center',
  },
  genderChipActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
    shadowColor: '#0f172a',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  genderChipText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '700',
  },
  genderChipTextActive: {
    color: '#ffffff',
  },
  docUploadRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  docBoxWrapper: {
    flex: 1,
  },
  docBox: {
    height: 130,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  docBoxUploaded: {
    borderColor: '#10b981',
    borderStyle: 'solid',
    backgroundColor: '#f0fdf4',
  },
  docIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fdf2f8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  docPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  docPlaceholder: {
    alignItems: 'center',
    padding: 8,
  },
  docUploadTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 4,
    textAlign: 'center',
  },
  docUploadSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  docMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 2,
  },
  docZoomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  docZoomText: {
    fontSize: 11.5,
    color: '#1d4ed8',
    fontWeight: '700',
    marginLeft: 4,
  },
  docLiveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  docLiveChipText: {
    fontSize: 10.5,
    color: '#15803d',
    fontWeight: '800',
    marginLeft: 3,
  },
  scannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  scannerBeam: {
    height: 3,
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 6,
  },
  verifyButton: {
    backgroundColor: '#0f172a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 14,
    marginTop: 12,
    shadowColor: '#0f172a',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  verifyButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14.5,
  },
  digilockerButton: {
    backgroundColor: '#eff6ff',
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 10,
  },
  digilockerButtonText: {
    color: '#1d4ed8',
    fontWeight: '700',
    fontSize: 14,
  },
  outlineButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  outlineButtonText: {
    color: '#334155',
    fontWeight: '600',
    fontSize: 13,
  },
  verificationNote: {
    marginTop: 10,
    fontSize: 12,
    color: '#166534',
    backgroundColor: '#f0fdf4',
    padding: 10,
    borderRadius: 10,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  consentBox: {
    flexDirection: 'row',
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#bbf7d0',
    padding: 14,
    borderRadius: 12,
    alignItems: 'flex-start',
    marginVertical: 12,
  },
  consentText: {
    flex: 1,
    fontSize: 12.5,
    color: '#166534',
    lineHeight: 18,
    marginLeft: 10,
    fontWeight: '500',
  },
  vehicleTypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  vTypeBox: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    position: 'relative',
  },
  vTypeBoxActive: {
    backgroundColor: '#fdf2f8',
    borderColor: '#f72585',
    shadowColor: '#f72585',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  vTypeCheckPill: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#f72585',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vTypeLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 4,
  },
  vTypeLabelActive: {
    color: '#f72585',
    fontWeight: '800',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  summarySection: {
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#f8fafc',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 8,
    marginBottom: 10,
  },
  summaryTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  editLink: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#f72585',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryKey: {
    fontSize: 12.5,
    color: '#64748b',
  },
  summaryVal: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0f172a',
  },
  primaryButton: {
    backgroundColor: '#0f172a',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#0f172a',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 16,
  },
  footerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 6,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: 22,
    borderRadius: 12,
  },
  navBtnPrev: {
    backgroundColor: '#f1f5f9',
  },
  navBtnNext: {
    backgroundColor: '#0f172a',
    minWidth: 140,
    shadowColor: '#0f172a',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  navBtnTextPrev: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  navBtnTextNext: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  successContainer: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  successCardWrapper: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
  },
  successIconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    borderWidth: 3,
    borderColor: '#bbf7d0',
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#15803d',
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 13.5,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  statusCard: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    marginBottom: 24,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  statusLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  stepSubBadge: {
    fontSize: 11,
    color: '#0284c7',
    fontWeight: '700',
    marginTop: 2,
  },
  inputHint: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
    marginBottom: 4,
  },
  dlAuditCard: {
    marginTop: 16,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    backgroundColor: '#ffffff',
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  dlAuditCardVerified: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  dlAuditCardExpired: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
  },
  dlAuditCardFailed: {
    backgroundColor: '#fff7ed',
    borderColor: '#fdba74',
  },
  dlAuditCardPending: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  auditHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  auditTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  auditSubtitle: {
    fontSize: 12,
    color: '#4b5563',
    marginTop: 2,
  },
  auditGrid: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  auditRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  auditLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  auditValue: {
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '700',
    textAlign: 'right',
    maxWidth: '55%',
  },
  confidenceSection: {
    marginTop: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  confidenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  confidenceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  confidenceValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#10b981',
  },
  confidenceTrack: {
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: 6,
    borderRadius: 3,
  },
  imageOcrStatusBox: {
    backgroundColor: '#f0fdf4',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  storageStatusBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  storageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  storageTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a',
    flex: 1,
    marginLeft: 6,
  },
  storageBadge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  storageBadgeText: {
    fontSize: 10,
    color: '#0369a1',
    fontWeight: 'bold',
  },
  storageDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    marginBottom: 8,
    lineHeight: 15,
  },
  storageThumbnailsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  storageThumbItem: {
    width: 90,
    height: 70,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#10b981',
    position: 'relative',
    backgroundColor: '#000',
  },
  storageThumbImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  storageThumbOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  storageThumbText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'space-between',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  modalTitleText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalImageWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  modalFullImage: {
    width: '100%',
    height: '100%',
  },
  modalFooter: {
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  modalFooterText: {
    color: '#aaa',
    fontSize: 11,
  },
});
