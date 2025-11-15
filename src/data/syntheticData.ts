/**
 * Synthetic Dataset Generator for QuantLab
 * Generates realistic but fake clinical research data for educational purposes
 */

export interface SyntheticPatient {
  id: number;
  age: number | null;
  gender: 'Male' | 'Female' | null;
  bmi: number | null;
  systolic_bp: number | null;
  diastolic_bp: number | null;
  heart_rate: number | null;
  creatinine: number | null;
  egfr: number | null;
  hemoglobin: number | null;
  diabetes: 0 | 1 | null;
  hypertension: 0 | 1 | null;
  smoking: 'Never' | 'Former' | 'Current' | null;
  readmitted: 0 | 1;
  los_days: number | null;
}

/**
 * Generate random normal distribution using Box-Muller transform
 */
function randomNormal(mean: number, std: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return z0 * std + mean;
}

/**
 * Generate synthetic clinical dataset
 */
export function generateSyntheticDataset(n: number = 300, seed: number = 42): SyntheticPatient[] {
  // Simple seeded random
  let currentSeed = seed;
  const seededRandom = () => {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    return currentSeed / 233280;
  };

  const data: SyntheticPatient[] = [];

  for (let i = 0; i < n; i++) {
    // Base characteristics
    const age = Math.max(18, Math.min(95, Math.round(randomNormal(65, 15))));
    const isMale = seededRandom() > 0.48;
    const gender = isMale ? 'Male' : 'Female';

    // BMI with realistic distribution
    const bmi = Math.max(15, Math.min(50, randomNormal(28, 6)));

    // Comorbidities (age-related)
    const diabetesProb = 0.15 + (age - 18) / 200; // Increases with age
    const diabetes = seededRandom() < diabetesProb ? 1 : 0;

    const htnProb = 0.2 + (age - 18) / 150;
    const hypertension = seededRandom() < htnProb ? 1 : 0;

    // Smoking status
    const smokingRand = seededRandom();
    const smoking = smokingRand < 0.5 ? 'Never' : smokingRand < 0.75 ? 'Former' : 'Current';

    // Blood pressure (influenced by hypertension)
    const systolic_bp = hypertension
      ? Math.round(randomNormal(145, 18))
      : Math.round(randomNormal(125, 12));
    const diastolic_bp = hypertension
      ? Math.round(randomNormal(88, 10))
      : Math.round(randomNormal(78, 8));

    // Heart rate
    const heart_rate = Math.round(randomNormal(75, 12));

    // Renal function (correlated - important for multicollinearity demo)
    const creatinine = Math.max(0.5, Math.min(3.5,
      randomNormal(1.1 + (diabetes ? 0.3 : 0), 0.4)
    ));
    // eGFR calculated from creatinine (creates multicollinearity)
    const egfr = Math.round(175 * Math.pow(creatinine, -1.154) * Math.pow(age, -0.203) * (isMale ? 1 : 0.742));

    // Hemoglobin
    const hemoglobin = randomNormal(isMale ? 14.5 : 13.0, 1.5);

    // Length of stay (outcome influenced by multiple factors)
    const los_days = Math.max(1, Math.round(
      3 + (age - 65) / 10 +
      (diabetes ? 1.5 : 0) +
      (hypertension ? 0.5 : 0) +
      randomNormal(0, 2)
    ));

    // Readmission (influenced by comorbidities and LOS)
    const readmitProb = 0.15 +
      (diabetes ? 0.1 : 0) +
      (hypertension ? 0.05 : 0) +
      (los_days > 7 ? 0.1 : 0);
    const readmitted = seededRandom() < readmitProb ? 1 : 0;

    data.push({
      id: i + 1,
      age,
      gender,
      bmi,
      systolic_bp,
      diastolic_bp,
      heart_rate,
      creatinine,
      egfr,
      hemoglobin,
      diabetes,
      hypertension,
      smoking,
      readmitted,
      los_days
    });
  }

  return data;
}

/**
 * Introduce missing data with specific mechanisms
 */
export function introduceMissingness(
  data: SyntheticPatient[],
  mechanism: 'MCAR' | 'MAR' | 'MNAR',
  variable: keyof SyntheticPatient,
  percentage: number
): SyntheticPatient[] {
  const result = JSON.parse(JSON.stringify(data)); // Deep clone

  for (let i = 0; i < result.length; i++) {
    let shouldBeMissing = false;

    if (mechanism === 'MCAR') {
      // Completely random
      shouldBeMissing = Math.random() < percentage;
    } else if (mechanism === 'MAR') {
      // Missing depends on age (observed variable)
      // Older patients more likely to have missing BMI
      const ageFactor = (result[i].age || 65) / 100;
      shouldBeMissing = Math.random() < (percentage * ageFactor);
    } else if (mechanism === 'MNAR') {
      // Missing depends on the value itself
      // Higher BMI more likely to be missing (people don't want to report)
      if (variable === 'bmi' && result[i].bmi !== null) {
        const bmiFactor = result[i].bmi! > 30 ? 2 : 1;
        shouldBeMissing = Math.random() < (percentage * bmiFactor);
      }
    }

    if (shouldBeMissing) {
      result[i][variable] = null;
    }
  }

  return result;
}

/**
 * Export dataset as CSV string
 */
export function datasetToCSV(data: SyntheticPatient[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const rows = data.map(row =>
    headers.map(header => {
      const value = row[header as keyof SyntheticPatient];
      return value === null ? '' : String(value);
    }).join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Pre-generated datasets for different use cases
 */
export const DATASETS = {
  clean: generateSyntheticDataset(300, 42),
  withMCAR: introduceMissingness(generateSyntheticDataset(300, 42), 'MCAR', 'bmi', 0.15),
  withMAR: introduceMissingness(generateSyntheticDataset(300, 42), 'MAR', 'bmi', 0.15),
  withMNAR: introduceMissingness(generateSyntheticDataset(300, 42), 'MNAR', 'bmi', 0.15),
  small: generateSyntheticDataset(100, 123),
  large: generateSyntheticDataset(500, 789),
};
