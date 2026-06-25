export interface PFCorrectionInput {
  activePowerKW: number;
  currentPF: number;
  targetPF: number;
  supplyVoltageV?: number; // optional, for capacitor sizing in microfarads
  frequency?: number;      // Hz, default 50
}

export interface PFCorrectionResult {
  activePowerKW: number;
  currentPF: number;
  targetPF: number;
  // Current state
  currentKVAR: number;
  currentKVA: number;
  currentAngleDeg: number;
  // Target state
  targetKVAR: number;
  targetKVA: number;
  targetAngleDeg: number;
  // Capacitor requirement
  requiredKVAR: number;        // Qc = P(tanφ₁ − tanφ₂)
  capacitorBankKVAR: number;   // rounded up to nearest standard size
  standardSizes: number[];     // recommended standard capacitor sizes
  // Savings
  kvaReduction: number;
  percentKVAReduction: number;
  // Physical sizing (if voltage provided)
  capacitanceUF?: number;
}

// Standard capacitor bank sizes available in market (kVAR)
const STANDARD_CAPACITOR_SIZES = [
  5, 10, 15, 20, 25, 30, 40, 50,
  60, 75, 100, 125, 150, 200, 250, 300,
];

export function calculatePFCorrection(
  input: PFCorrectionInput
): PFCorrectionResult {
  const {
    activePowerKW,
    currentPF,
    targetPF,
    supplyVoltageV,
    frequency = 50,
  } = input;

  // Current state
  const currentAngleRad = Math.acos(currentPF);
  const currentAngleDeg = parseFloat(
    ((currentAngleRad * 180) / Math.PI).toFixed(2)
  );
  const tanPhi1 = Math.tan(currentAngleRad);
  const currentKVA = parseFloat((activePowerKW / currentPF).toFixed(3));
  const currentKVAR = parseFloat(
    Math.sqrt(currentKVA ** 2 - activePowerKW ** 2).toFixed(3)
  );

  // Target state
  const targetAngleRad = Math.acos(targetPF);
  const targetAngleDeg = parseFloat(
    ((targetAngleRad * 180) / Math.PI).toFixed(2)
  );
  const tanPhi2 = Math.tan(targetAngleRad);
  const targetKVA = parseFloat((activePowerKW / targetPF).toFixed(3));
  const targetKVAR = parseFloat(
    Math.sqrt(targetKVA ** 2 - activePowerKW ** 2).toFixed(3)
  );

  // Capacitor bank requirement: Qc = P(tanφ₁ − tanφ₂)
  const requiredKVAR = parseFloat(
    (activePowerKW * (tanPhi1 - tanPhi2)).toFixed(3)
  );

  // Round up to nearest standard size
  const capacitorBankKVAR =
    STANDARD_CAPACITOR_SIZES.find((s) => s >= requiredKVAR) ??
    Math.ceil(requiredKVAR / 50) * 50;

  // Nearest 3 standard sizes for recommendation
  const standardSizes = STANDARD_CAPACITOR_SIZES.filter(
    (s) => s >= requiredKVAR && s <= requiredKVAR * 1.5
  ).slice(0, 3);

  // kVA savings
  const kvaReduction = parseFloat((currentKVA - targetKVA).toFixed(3));
  const percentKVAReduction = parseFloat(
    ((kvaReduction / currentKVA) * 100).toFixed(1)
  );

  // Capacitance in microfarads (C = Qc / (2π × f × V²) × 10⁹)
  let capacitanceUF: number | undefined;
  if (supplyVoltageV) {
    capacitanceUF = parseFloat(
      (
        (requiredKVAR * 1000) /
        (2 * Math.PI * frequency * supplyVoltageV ** 2) *
        1e6
      ).toFixed(2)
    );
  }

  return {
    activePowerKW,
    currentPF,
    targetPF,
    currentKVAR,
    currentKVA,
    currentAngleDeg,
    targetKVAR,
    targetKVA,
    targetAngleDeg,
    requiredKVAR,
    capacitorBankKVAR,
    standardSizes,
    kvaReduction,
    percentKVAReduction,
    capacitanceUF,
  };
}