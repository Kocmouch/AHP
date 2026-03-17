export type CriterionDirection = "min" | "max";

export interface Expert {
  id: string;
  name: string;
}

export interface AHPState {
  experts: Expert[];
  expertCriteriaSliders: number[][][];   // [expertIdx][i][j]
  expertAltSliders: number[][][][];      // [expertIdx][criterionIdx][i][j]
  criteria: string[];
  alternatives: string[];
  criteriaDirections: CriterionDirection[];
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
