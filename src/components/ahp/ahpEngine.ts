import type { ConsistencyResult, CriterionDirection } from "./types";

const RI = [0, 0, 0.58, 0.9, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49];

export function sliderToRatio(v: number): number {
  if (v > 0) return v + 1;
  if (v === 0) return 1;
  return 1 / (Math.abs(v) + 1);
}

export function buildMatrix(n: number, sliders: number[][]): number[][] {
  const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(1));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const ratio = sliderToRatio(sliders[i]?.[j] ?? 0);
      const rowI = matrix[i];
      const rowJ = matrix[j];
      if (rowI && rowJ) {
        rowI[j] = ratio;
        rowJ[i] = 1 / ratio;
      }
    }
  }
  return matrix;
}

export function computeWeights(matrix: number[][]): ConsistencyResult {
  const n = matrix.length;
  if (n === 0) return { weights: [], lambdaMax: 0, CI: 0, CR: 0, isConsistent: true };

  // Column sums
  const colSums = Array(n).fill(0) as number[];
  for (let j = 0; j < n; j++) {
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const val = matrix[i]?.[j];
      if (val !== undefined) {
        sum += val;
      }
    }
    colSums[j] = sum;
  }

  // Normalize each column, then row averages = weights
  const weights = Array(n).fill(0) as number[];
  for (let i = 0; i < n; i++) {
    let rowWeightSum = 0;
    for (let j = 0; j < n; j++) {
      const val = matrix[i]?.[j];
      const sum = colSums[j];
      if (val !== undefined && sum !== undefined && sum !== 0) {
        rowWeightSum += val / sum;
      }
    }
    weights[i] = rowWeightSum / n;
  }

  // λ_max
  let lambdaMax = 0;
  for (let j = 0; j < n; j++) {
    const colSum = colSums[j] ?? 0;
    const weight = weights[j] ?? 0;
    lambdaMax += colSum * weight;
  }

  const CI = n <= 1 ? 0 : (lambdaMax - n) / (n - 1);
  const ri = RI[n - 1] ?? 1.49;
  const CR = n <= 2 ? 0 : CI / ri;

  return { weights, lambdaMax, CI, CR, isConsistent: CR <= 0.1 };
}

/**
 * Converts raw numeric values for alternatives into AHP slider values.
 * direction="min": lower value is better (e.g. price)
 * direction="max": higher value is better (e.g. quality)
 * Returns a sliders matrix (upper triangle filled, rest 0).
 */
export function rawValuesToSliders(
  values: (number | null)[],
  direction: CriterionDirection
): number[][] {
  const n = values.length;
  const sliders: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const a = values[i] as number | null | undefined;
      const b = values[j] as number | null | undefined;
      if (a == null || b == null || a === 0 || b === 0) continue;

      // ratio: how much better is i vs j
      const ratio = direction === "min" ? (b as number) / (a as number) : (a as number) / (b as number);

      // Convert ratio to slider value in range [-8..8]
      // ratio > 1 means i is better → positive slider
      // ratio < 1 means j is better → negative slider
      let slider: number;
      if (ratio >= 1) {
        slider = Math.min(Math.round(ratio) - 1, 8);
      } else {
        slider = -Math.min(Math.round(1 / ratio) - 1, 8);
      }
      const sliderRow = sliders[i];
      if (sliderRow) {
        sliderRow[j] = slider;
      }
    }
  }
  return sliders;
}

export function computeFinalScores(
  criteriaWeights: number[],
  altWeights: number[][]
): number[] {
  const numAlts = altWeights[0]?.length ?? 0;
  const scores = Array(numAlts).fill(0) as number[];
  for (let c = 0; c < criteriaWeights.length; c++) {
    const criterionWeight = criteriaWeights[c] ?? 0;
    const currentAltWeights = altWeights[c];
    for (let a = 0; a < numAlts; a++) {
      const currentScore = scores[a] ?? 0;
      scores[a] = currentScore + (criterionWeight * (currentAltWeights?.[a] ?? 0));
    }
  }
  return scores;
}
