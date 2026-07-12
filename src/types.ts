export interface DecisionProCon {
  point: string;
  impact: number; // 1 to 5
}

export interface DecisionOption {
  name: string;
  pros: DecisionProCon[];
  cons: DecisionProCon[];
}

export interface ComparisonRow {
  criterion: string;
  optionA_val: string;
  optionB_val: string;
  winner: string;
}

export interface SwotAnalysis {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface DecisionVerdict {
  recommendedOption: string;
  confidenceScore: number; // 1 to 100
  summary: string;
  keyDecidingFactor: string;
}

export interface DecisionAnalysisResponse {
  title: string;
  verdict: DecisionVerdict;
  options: DecisionOption[];
  comparisonTable: ComparisonRow[];
  swotAnalysis: SwotAnalysis;
}

export interface DecisionHistoryItem {
  id: string;
  timestamp: string;
  dilemma: string;
  optionA: string;
  optionB: string;
  context?: string;
  result: DecisionAnalysisResponse;
}
