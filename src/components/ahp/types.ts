export type CriterionDirection = "min" | "max";

export interface AHPState {
  criteria: string[];
  alternatives: string[];
  criteriaDirections: CriterionDirection[];
  criteriaSliders: number[][];
  altSliders: number[][][];
  // raw numeric values per criterion per alternative (null = not set)
  criteriaRawValues: (number | null)[][];
  activeStep: number;
}

export interface ConsistencyResult {
  weights: number[];
  lambdaMax: number;
  CI: number;
  CR: number;
  isConsistent: boolean;
}
