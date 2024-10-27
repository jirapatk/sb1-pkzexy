import { mean, variance } from "./statistics";

export function calculateTTest(group1: number[], group2: number[]): {
  tValue: number;
  pValue: number;
  degreesOfFreedom: number;
  mean1: number;
  mean2: number;
  stdDev1: number;
  stdDev2: number;
  standardError: number;
  confidenceInterval: string;
} {
  const n1 = group1.length;
  const n2 = group2.length;
  
  const mean1 = mean(group1);
  const mean2 = mean(group2);
  
  const variance1 = variance(group1);
  const variance2 = variance(group2);
  
  const stdDev1 = Math.sqrt(variance1);
  const stdDev2 = Math.sqrt(variance2);
  
  const pooledVariance = ((n1 - 1) * variance1 + (n2 - 1) * variance2) / (n1 + n2 - 2);
  const standardError = Math.sqrt(pooledVariance * (1/n1 + 1/n2));
  
  const tValue = (mean1 - mean2) / standardError;
  const degreesOfFreedom = n1 + n2 - 2;
  
  // Calculate p-value using t-distribution approximation
  const pValue = 2 * (1 - normalCDF(Math.abs(tValue)));
  
  // Calculate 95% confidence interval
  const criticalValue = 1.96; // Approximate for large sample sizes
  const marginOfError = criticalValue * standardError;
  const confidenceInterval = `${(mean1 - mean2 - marginOfError).toFixed(3)} to ${(mean1 - mean2 + marginOfError).toFixed(3)}`;
  
  return {
    tValue,
    pValue,
    degreesOfFreedom,
    mean1,
    mean2,
    stdDev1,
    stdDev2,
    standardError,
    confidenceInterval
  };
}

export function calculateANOVA(groups: number[][]): {
  fValue: number;
  pValue: number;
  dfBetween: number;
  dfWithin: number;
  sumSquaresBetween: number;
  sumSquaresWithin: number;
  meanSquareBetween: number;
  meanSquareWithin: number;
  etaSquared: number;
} {
  const groupMeans = groups.map(group => mean(group));
  const totalN = groups.reduce((sum, group) => sum + group.length, 0);
  const grandMean = groups.flat().reduce((sum, val) => sum + val, 0) / totalN;
  
  // Calculate Sum of Squares Between Groups
  const SSB = groups.reduce((sum, group, i) => 
    sum + group.length * Math.pow(groupMeans[i] - grandMean, 2), 0
  );
  
  // Calculate Sum of Squares Within Groups
  const SSW = groups.reduce((sum, group, i) => 
    sum + group.reduce((s, value) => 
      s + Math.pow(value - groupMeans[i], 2), 0
    ), 0
  );
  
  const dfBetween = groups.length - 1;
  const dfWithin = totalN - groups.length;
  
  const MSB = SSB / dfBetween;
  const MSW = SSW / dfWithin;
  
  const fValue = MSB / MSW;
  
  // Calculate p-value using F-distribution approximation
  const pValue = 1 - fDistribution(fValue, dfBetween, dfWithin);
  
  // Calculate effect size (eta squared)
  const etaSquared = SSB / (SSB + SSW);
  
  return {
    fValue,
    pValue,
    dfBetween,
    dfWithin,
    sumSquaresBetween: SSB,
    sumSquaresWithin: SSW,
    meanSquareBetween: MSB,
    meanSquareWithin: MSW,
    etaSquared
  };
}

export function calculateRegressionAnalysis(x: number[], y: number[]): {
  slope: number;
  intercept: number;
  rSquared: number;
  standardError: number;
  fStatistic: number;
  pValue: number;
  confidenceIntervals: {
    slope: string;
    intercept: string;
  };
  predictions: number[];
  residuals: number[];
} {
  const n = x.length;
  const meanX = mean(x);
  const meanY = mean(y);
  
  let xxSum = 0;
  let xySum = 0;
  let yySum = 0;
  
  for (let i = 0; i < n; i++) {
    xxSum += (x[i] - meanX) * (x[i] - meanX);
    xySum += (x[i] - meanX) * (y[i] - meanY);
    yySum += (y[i] - meanY) * (y[i] - meanY);
  }
  
  const slope = xySum / xxSum;
  const intercept = meanY - slope * meanX;
  const rSquared = (xySum * xySum) / (xxSum * yySum);
  
  // Calculate predictions and residuals
  const predictions = x.map(xi => slope * xi + intercept);
  const residuals = y.map((yi, i) => yi - predictions[i]);
  
  // Calculate standard error and confidence intervals
  const residualSS = residuals.reduce((sum, r) => sum + r * r, 0);
  const standardError = Math.sqrt(residualSS / (n - 2));
  
  const slopeStdError = standardError / Math.sqrt(xxSum);
  const interceptStdError = standardError * Math.sqrt(1/n + (meanX * meanX) / xxSum);
  
  const tValue = 1.96; // Approximate for large sample sizes
  const slopeCI = `${(slope - tValue * slopeStdError).toFixed(3)} to ${(slope + tValue * slopeStdError).toFixed(3)}`;
  const interceptCI = `${(intercept - tValue * interceptStdError).toFixed(3)} to ${(intercept + tValue * interceptStdError).toFixed(3)}`;
  
  // Calculate F-statistic and p-value
  const fStatistic = (rSquared / 1) / ((1 - rSquared) / (n - 2));
  const pValue = 1 - fDistribution(fStatistic, 1, n - 2);
  
  return {
    slope,
    intercept,
    rSquared,
    standardError,
    fStatistic,
    pValue,
    confidenceIntervals: {
      slope: slopeCI,
      intercept: interceptCI
    },
    predictions,
    residuals
  };
}

// Helper functions
function normalCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const probability = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - probability : probability;
}

function fDistribution(x: number, d1: number, d2: number): number {
  // This is a simplified approximation of the F-distribution CDF
  return 1 / (1 + Math.exp(-(x - (d1 + d2)/2) / Math.sqrt(d1 * d2)));
}
