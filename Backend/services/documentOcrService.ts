import Tesseract from 'tesseract.js';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface DlImageAnalysisResult {
  isAuthenticDocument: boolean;
  confidenceScore: number;
  extractedDlNumber?: string;
  extractedDob?: string;
  extractedExpiryDate?: string;
  extractedName?: string;
  extractedAddress?: string;
  detectedState?: string;
  detectedStateCode?: string;
  detectedRto?: string;
  hasDlHeader: boolean;
  hasGovernmentSeal: boolean;
  isExpired?: boolean;
  rawText: string;
  validationIssues: string[];
}

export interface PanImageAnalysisResult {
  isAuthenticDocument: boolean;
  confidenceScore: number;
  extractedPanNumber?: string;
  extractedName?: string;
  extractedDob?: string;
  hasIncomeTaxHeader: boolean;
  rawText: string;
  validationIssues: string[];
}

export interface RcImageAnalysisResult {
  isAuthenticDocument: boolean;
  confidenceScore: number;
  extractedPlateNumber?: string;
  extractedVehicleClass?: string;
  hasRcHeader: boolean;
  rawText: string;
  validationIssues: string[];
}

export const STATE_CODE_MAP: Record<string, string> = {
  AN: 'Andaman & Nicobar',
  AP: 'Andhra Pradesh',
  AR: 'Arunachal Pradesh',
  AS: 'Assam',
  BR: 'Bihar',
  CG: 'Chhattisgarh',
  CH: 'Chandigarh',
  DD: 'Daman & Diu',
  DL: 'Delhi',
  DN: 'Dadra & Nagar Haveli',
  GA: 'Goa',
  GJ: 'Gujarat',
  HP: 'Himachal Pradesh',
  HR: 'Haryana',
  JH: 'Jharkhand',
  JK: 'Jammu & Kashmir',
  KA: 'Karnataka',
  KL: 'Kerala',
  LA: 'Ladakh',
  LD: 'Lakshadweep',
  MH: 'Maharashtra',
  ML: 'Meghalaya',
  MN: 'Manipur',
  MP: 'Madhya Pradesh',
  MZ: 'Mizoram',
  NL: 'Nagaland',
  OD: 'Odisha',
  PB: 'Punjab',
  PY: 'Puducherry',
  RJ: 'Rajasthan',
  SK: 'Sikkim',
  TG: 'Telangana',
  TN: 'Tamil Nadu',
  TR: 'Tripura',
  TS: 'Telangana',
  UK: 'Uttarakhand',
  UP: 'Uttar Pradesh',
  WB: 'West Bengal',
};

/**
 * Normalizes input image (base64 string, URL, or local path) into a Buffer for reliable OCR execution
 */
async function prepareImageSource(imageInput: string): Promise<Buffer | string> {
  if (!imageInput) return Buffer.alloc(0);

  // 1. Base64 data URI
  if (imageInput.startsWith('data:image/')) {
    const base64Data = imageInput.replace(/^data:image\/[a-zA-Z0-9]+;base64,/, '');
    return Buffer.from(base64Data, 'base64');
  }

  // 2. Remote HTTP / HTTPS URL
  if (imageInput.startsWith('http://') || imageInput.startsWith('https://')) {
    try {
      const response = await axios.get(imageInput, {
        responseType: 'arraybuffer',
        timeout: 10000,
      });
      return Buffer.from(response.data);
    } catch (e: any) {
      console.warn('[DocumentOcr] Failed to fetch remote image URL for OCR:', e.message);
      return imageInput;
    }
  }

  // 3. Absolute local file path
  if (fs.existsSync(imageInput)) {
    return fs.readFileSync(imageInput);
  }

  // 4. Relative web paths like /uploads/documents/xyz.jpg or uploads/documents/xyz.jpg
  if (imageInput.startsWith('/uploads/') || imageInput.startsWith('uploads/')) {
    const cleanRel = imageInput.replace(/^\/+/, '');
    const filename = path.basename(cleanRel);
    const candidatePaths = [
      path.resolve(process.cwd(), cleanRel),
      path.resolve(process.cwd(), 'Backend', cleanRel),
      path.resolve(process.cwd(), 'uploads/documents', filename),
      path.resolve(process.cwd(), 'Backend/uploads/documents', filename),
      path.join(process.cwd(), '../Backend/uploads/documents', filename),
      path.join(__dirname, '..', cleanRel),
      path.join(__dirname, '../uploads/documents', filename),
    ];
    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        return fs.readFileSync(p);
      }
    }
  }

  // 5. Raw base64 string without data URI header
  try {
    if (imageInput.length > 100 && /^[A-Za-z0-9+/=]+$/.test(imageInput.slice(0, 100))) {
      return Buffer.from(imageInput, 'base64');
    }
  } catch (_) {}

  return imageInput;
}

export const documentOcrService = {
  /**
   * Run OCR on an image and extract raw text
   */
  recognizeText: async (imageInput: string): Promise<string> => {
    try {
      const source = await prepareImageSource(imageInput);
      const { data } = await Tesseract.recognize(source, 'eng', {
        logger: () => {},
      });
      return data.text || '';
    } catch (err: any) {
      console.error('[DocumentOcr] OCR Recognition failed:', err.message);
      return '';
    }
  },

  /**
   * Analyze Driving Licence (DL) Image
   * Verifies whether the uploaded image is actually an Indian Driving Licence,
   * extracts the DL Number, State Authority, DOB, Expiry Date, and checks authenticity.
   */
  analyzeDrivingLicenseImage: async (
    frontImage: string,
    backImage?: string,
    expectedDlNumber?: string
  ): Promise<DlImageAnalysisResult> => {
    const validationIssues: string[] = [];

    // Run OCR on front image
    const frontText = await documentOcrService.recognizeText(frontImage);
    let backText = '';
    if (backImage) {
      backText = await documentOcrService.recognizeText(backImage);
    }

    const combinedText = `${frontText}\n${backText}`.toUpperCase();
    console.log('[DocumentOcr] DL OCR Extracted text snippet:', combinedText.slice(0, 150));

    // 1. Check for Driving Licence Headers & Government Seals
    const dlKeywords = [
      'DRIVING LICENCE',
      'DRIVING LICENSE',
      'UNION OF INDIA',
      'INDIAN UNION',
      'MOTOR VEHICLES',
      'TRANSPORT DEPARTMENT',
      'FORM 7',
      'SARATHI',
      'LICENCE TO DRIVE',
      'DL NO',
      'D.L. NO',
      'AUTHORISED TO DRIVE',
      'GOVERNMENT OF',
      'DEPT OF TRANSPORT',
      'COMMISSIONER FOR TRANSPORT',
      'RTO',
      'VALIDITY',
      'ISSUE DATE',
      'DATE OF BIRTH',
      'BLOOD GROUP',
      'HOLDER',
      'SON / DAUGHTER',
    ];

    let matchCount = 0;
    for (const kw of dlKeywords) {
      if (combinedText.includes(kw)) {
        matchCount++;
      }
    }

    const hasDlHeader = matchCount >= 1;
    const hasGovernmentSeal =
      combinedText.includes('UNION OF INDIA') ||
      combinedText.includes('GOVERNMENT') ||
      combinedText.includes('TRANSPORT DEPARTMENT') ||
      combinedText.includes('SARATHI');

    // 2. Extract DL Number from image text
    // Patterns:
    // Standard 16-char: KA01 20180001234 or TG024 20250002893 or TG02420250002893
    // Legacy formats: DL-1420110012345 or MH02 1234567
    let extractedDlNumber: string | undefined;

    // Remove dashes and slashes for regex matching
    const cleanNoSpace = combinedText.replace(/[-/:\.]/g, ' ');

    const dlRegexList = [
      /\b([A-Z]{2}\s?[0-9]{2,3}\s?[0-9]{4}\s?[0-9]{7})\b/i,
      /\b([A-Z]{2}[0-9]{2,3}[0-9]{4}[0-9]{7})\b/i,
      /\b([A-Z]{2}\s?[0-9]{2,3}\s?[0-9]{11})\b/i,
      /\b([A-Z]{2}[0-9]{13,16})\b/i,
      /(?:DL\s*NO[.:\s]*)([A-Z0-9\s-]{10,20})/i,
      /(?:LICENCE\s*NO[.:\s]*)([A-Z0-9\s-]{10,20})/i,
    ];

    for (const regex of dlRegexList) {
      const match = cleanNoSpace.match(regex);
      if (match && match[1]) {
        const candidate = match[1].replace(/\s+/g, '').toUpperCase();
        const prefix = candidate.slice(0, 2);
        if (STATE_CODE_MAP[prefix]) {
          extractedDlNumber = candidate;
          break;
        }
      }
    }

    // Direct search if regex missed spaces
    if (!extractedDlNumber) {
      const looseMatch = combinedText.match(/\b(TG|TS|AP|KA|MH|DL|TN|KL|GJ|HR|UP|MP|RJ|WB|PB|OD|BR|JH)[0-9A-Z\s]{11,18}\b/i);
      if (looseMatch) {
        const cand = looseMatch[0].replace(/[^A-Z0-9]/gi, '').toUpperCase();
        if (cand.length >= 13 && cand.length <= 17) {
          extractedDlNumber = cand;
        }
      }
    }

    // 3. Detect State & RTO
    let detectedStateCode: string | undefined;
    let detectedState: string | undefined;
    let detectedRto: string | undefined;

    if (extractedDlNumber) {
      detectedStateCode = extractedDlNumber.slice(0, 2);
      detectedState = STATE_CODE_MAP[detectedStateCode];
      detectedRto = extractedDlNumber.slice(0, 5);
    } else {
      // Fallback: search for state names in text
      for (const [code, name] of Object.entries(STATE_CODE_MAP)) {
        if (combinedText.includes(name.toUpperCase())) {
          detectedStateCode = code;
          detectedState = name;
          break;
        }
      }
    }

    // 4. Extract Legal Full Name
    let extractedName: string | undefined;
    const nameMatch = combinedText.match(/NAME[\s.:|]*([A-Z\s]{3,35}?)(?:TEL|HOKDER|HOLDER|FATHER|SON|DOB|DATE|BLOOD|\n)/i);
    if (nameMatch && nameMatch[1]) {
      const cleanName = nameMatch[1].replace(/[^A-Z\s]/g, '').trim();
      if (cleanName.length >= 3) {
        extractedName = cleanName;
      }
    }

    // Fallback name extraction: look for person's name preceding DOB/BIRTH/FATHER/SON/WIFE line
    if (!extractedName) {
      const candidateLines = combinedText.split('\n').map(l => l.trim()).filter(Boolean);
      for (let i = 0; i < candidateLines.length; i++) {
        const line = candidateLines[i];
        if (/(?:BIRTH|DOB|SON|DAUGHTER|WIFE|BLOOD)/i.test(line) && i > 0) {
          const prevLine = candidateLines[i - 1];
          const cleanPrev = prevLine.replace(/[^A-Z\s]/g, '').trim();
          if (
            cleanPrev.length >= 3 &&
            !['VALIDITY', 'VALID', 'ISSUE', 'TRANSPORT', 'INDIA', 'UNION', 'SARATHI'].some(w => cleanPrev.includes(w))
          ) {
            extractedName = cleanPrev.replace(/\s+(FL|TEL)$/i, '').trim();
            break;
          }
        }
      }
    }

    // 5. Extract Date of Birth (DOB) -> YYYY-MM-DD
    let extractedDob: string | undefined;
    const dobMatch = combinedText.match(/(?:DOB|DATE OF BIRTH|D\.O\.B|F BIRTH)[\s.:]*([0-9]{1,2})[-/.]([0-9]{1,2})[-/.]([0-9]{4})/i);
    if (dobMatch) {
      extractedDob = `${dobMatch[3]}-${dobMatch[2].padStart(2, '0')}-${dobMatch[1].padStart(2, '0')}`;
    } else {
      const dobPartial = combinedText.match(/(?:DOB|DATE OF BIRTH|D\.O\.B|F BIRTH)[\s.:]*([0-9]{1,2})[-/.]([0-9]{4})/i);
      if (dobPartial) {
        extractedDob = `${dobPartial[2]}-${dobPartial[1].padStart(2, '0')}-01`;
      }
    }

    // 6. Extract Expiry Date / Valid Till -> YYYY-MM-DD
    let extractedExpiryDate: string | undefined;
    let isExpired = false;

    // Search for future validity dates
    const allDateMatches = [...combinedText.matchAll(/([0-9]{2})[-/.]([0-9]{2})[-/.]([0-9]{4})/g)];
    const futureDates = allDateMatches
      .map(d => ({
        formatted: `${d[3]}-${d[2]}-${d[1]}`,
        year: parseInt(d[3], 10),
      }))
      .filter(d => d.year >= 2024);

    if (futureDates.length > 0) {
      // Sort descending; non-transport validity is furthest into future
      futureDates.sort((a, b) => b.year - a.year);
      extractedExpiryDate = futureDates[0].formatted;
      const expTime = new Date(extractedExpiryDate).getTime();
      if (!isNaN(expTime)) {
        isExpired = expTime < Date.now();
      }
    }

    // 7. Extract Address
    let extractedAddress: string | undefined;
    const addrMatch = combinedText.match(/ADDRESS[\s\S]*?([0-9A-Z,\s-]{15,100}?[0-9]{6})/i);
    if (addrMatch && addrMatch[1]) {
      extractedAddress = addrMatch[1].replace(/\s+/g, ' ').trim();
    }

    // 6. Compare with expected DL Number if user supplied one
    let numberMatches = true;
    if (expectedDlNumber && extractedDlNumber) {
      const cleanExpected = expectedDlNumber.replace(/[\s-]/g, '').toUpperCase();
      const cleanExtracted = extractedDlNumber.replace(/[\s-]/g, '').toUpperCase();
      if (cleanExpected !== cleanExtracted) {
        numberMatches = false;
        validationIssues.push(
          `DL number mismatch: Entered (${cleanExpected}) differs from image (${cleanExtracted}).`
        );
      }
    }

    // 7. Calculate Confidence & Authenticity
    let confidence = 0;
    if (hasDlHeader) confidence += 35;
    if (hasGovernmentSeal) confidence += 20;
    if (extractedDlNumber) confidence += 30;
    if (detectedState) confidence += 10;
    if (extractedDob || extractedExpiryDate) confidence += 5;

    // Minimum criteria:
    // Must either have a DL header OR a valid Indian DL format matching an Indian State code
    const isAuthenticDocument =
      (hasDlHeader && (!!extractedDlNumber || !!detectedState)) ||
      (!!extractedDlNumber && !!detectedState) ||
      (matchCount >= 2 && confidence >= 40);

    if (!hasDlHeader && !extractedDlNumber) {
      validationIssues.push(
        'No Driving Licence headers, emblem, or valid licence registration number found in image.'
      );
    }

    if (isExpired) {
      validationIssues.push('The Driving Licence shown in the photo has expired.');
    }

    return {
      isAuthenticDocument,
      confidenceScore: Math.min(confidence, 100),
      extractedDlNumber,
      extractedDob,
      extractedExpiryDate,
      extractedName,
      extractedAddress,
      detectedState,
      detectedStateCode,
      detectedRto,
      hasDlHeader,
      hasGovernmentSeal,
      isExpired,
      rawText: combinedText.slice(0, 500),
      validationIssues,
    };
  },

  /**
   * Analyze PAN Card Image
   */
  analyzePanImage: async (imageInput: string, expectedPan?: string): Promise<PanImageAnalysisResult> => {
    const raw = await documentOcrService.recognizeText(imageInput);
    const text = raw.toUpperCase();
    const validationIssues: string[] = [];

    const hasIncomeTaxHeader =
      text.includes('INCOME TAX') ||
      text.includes('GOVT. OF INDIA') ||
      text.includes('GOVERNMENT OF INDIA') ||
      text.includes('PERMANENT ACCOUNT NUMBER');

    // PAN pattern: 5 uppercase letters + 4 digits + 1 uppercase letter
    const panMatch = text.match(/\b([A-Z]{5}[0-9]{4}[A-Z]{1})\b/);
    const extractedPanNumber = panMatch ? panMatch[1] : undefined;

    let confidence = 0;
    if (hasIncomeTaxHeader) confidence += 45;
    if (extractedPanNumber) confidence += 45;
    if (text.includes('NAME') || text.includes('FATHER')) confidence += 10;

    if (expectedPan && extractedPanNumber && expectedPan.toUpperCase() !== extractedPanNumber) {
      validationIssues.push(
        `PAN mismatch: Entered (${expectedPan}) does not match scanned image (${extractedPanNumber}).`
      );
    }

    const isAuthenticDocument = hasIncomeTaxHeader && !!extractedPanNumber;

    return {
      isAuthenticDocument,
      confidenceScore: Math.min(confidence, 100),
      extractedPanNumber,
      hasIncomeTaxHeader,
      rawText: text.slice(0, 400),
      validationIssues,
    };
  },
};

export default documentOcrService;
