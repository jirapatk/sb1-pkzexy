"use client";

export function calculateCronbachAlpha(data: any[], variables: string[]): { alpha: number, itemTotalCorrelations: Record<string, number> } | undefined {
  try {
    // Convert data to numerical matrix
    const matrix = data.map(row => 
      variables.map(v => parseFloat(row[v])).filter(v => !isNaN(v))
    ).filter(row => row.length === variables.length);

    if (matrix.length === 0 || variables.length < 2) return undefined;

    // Calculate item variances
    const itemVariances = variables.map((_, j) => {
      const column = matrix.map(row => row[j]);
      return variance(column);
    });

    // Calculate total variance
    const rowSums = matrix.map(row => row.reduce((a, b) => a + b, 0));
    const totalVariance = variance(rowSums);

    // Cronbach's Alpha formula
    const k = variables.length;
    const itemVarianceSum = itemVariances.reduce((a, b) => a + b, 0);
    
    const alpha = (k / (k - 1)) * (1 - (itemVarianceSum / totalVariance));

    const itemTotalCorrelations: Record<string, number> = {};
    variables.forEach((variable, index) => {
      const itemScores = matrix.map(row => row[index]);
      const totalScores = matrix.map(row => row.reduce((a, b) => a + b, 0) - row[index]);
      itemTotalCorrelations[variable] = calculateCorrelation(itemScores, totalScores);
    });

    return { alpha, itemTotalCorrelations };
  } catch (error) {
    console.error("Error calculating Cronbach's Alpha:", error);
    return undefined;
  }
}

export function calculateDescriptiveStats(data: any[], variable: string) {
  const values = data.map(row => parseFloat(row[variable])).filter(v => !isNaN(v));
  const n = values.length;
  if (n === 0) return null;

  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / n;
  const sortedValues = [...values].sort((a, b) => a - b);
  const median = n % 2 === 0
    ? (sortedValues[n/2 - 1] + sortedValues[n/2]) / 2
    : sortedValues[Math.floor(n/2)];
  
  const varVal = variance(values);
  const stdDev = Math.sqrt(varVal);
  const skewness = calculateSkewness(values);
  const kurtosis = calculateKurtosis(values);
  const sem = stdDev / Math.sqrt(n);
  
  return {
    n,
    mean: mean.toFixed(3),
    median: median.toFixed(3),
    mode: calculateMode(values),
    sum: sum.toFixed(3),
    min: Math.min(...values).toFixed(3),
    max: Math.max(...values).toFixed(3),
    range: (Math.max(...values) - Math.min(...values)).toFixed(3),
    stdDev: stdDev.toFixed(3),
    variance: varVal.toFixed(3),
    skewness: skewness.toFixed(3),
    kurtosis: kurtosis.toFixed(3),
    standardError: sem.toFixed(3),
    confidenceInterval95: calculateConfidenceInterval(mean, sem, n),
    quartiles: calculateQuartiles(sortedValues),
    interquartileRange: calculateInterquartileRange(sortedValues),
  };
}

export function calculateCorrelation(x: number[], y: number[]): number {
  const pairs = x
    .map((xi, i) => [xi, y[i]])
    .filter(pair => !pair.some(isNaN));

  if (pairs.length === 0) return 0;

  const meanX = mean(x);
  const meanY = mean(y);
  
  const numerator = pairs.reduce((sum, [xi, yi]) => 
    sum + ((xi - meanX) * (yi - meanY)), 0);
  
  const denominator = Math.sqrt(
    x.reduce((sum, xi) => sum + Math.pow(xi - meanX, 2), 0) *
    y.reduce((sum, yi) => sum + Math.pow(yi - meanY, 2), 0)
  );
  
  return numerator / denominator;
}

function mean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function variance(values: number[]): number {
  const m = mean(values);
  return values.reduce((sum, x) => sum + Math.pow(x - m, 2), 0) / values.length;
}

function calculateMode(values: number[]): string {
  const counts = values.reduce((acc, val) => {
    acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
  
  const maxCount = Math.max(...Object.values(counts));
  const modes = Object.keys(counts).filter(key => counts[Number(key)] === maxCount);
  
  return modes.join(', ');
}

function calculateSkewness(values: number[]): number {
  const n = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const m3 = values.reduce((acc, val) => acc + Math.pow(val - mean, 3), 0) / n;
  const m2 = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
  return m3 / Math.pow(m2, 3/2);
}

function calculateKurtosis(values: number[]): number {
  const n = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const m4 = values.reduce((acc, val) => acc + Math.pow(val - mean, 4), 0) / n;
  const m2 = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
  return (m4 / Math.pow(m2, 2)) - 3;
}

function calculateConfidenceInterval(mean: number, sem: number, n: number): string {
  const tValue = 1.96; // Approximate t-value for 95% CI
  const margin = tValue * sem;
  return `${(mean - margin).toFixed(3)} - ${(mean + margin).toFixed(3)}`;
}

function calculateQuartiles(sortedValues: number[]): { Q1: string, Q2: string, Q3: string } {
  const n = sortedValues.length;
  const Q1 = sortedValues[Math.floor(n * 0.25)];
  const Q2 = sortedValues[Math.floor(n * 0.5)];
  const Q3 = sortedValues[Math.floor(n * 0.75)];
  return { Q1: Q1.toFixed(3), Q2: Q2.toFixed(3), Q3: Q3.toFixed(3) };
}

function calculateInterquartileRange(sortedValues: number[]): string {
  const n = sortedValues.length;
  const Q1 = sortedValues[Math.floor(n * 0.25)];
  const Q3 = sortedValues[Math.floor(n * 0.75)];
  return (Q3 - Q1).toFixed(3);
}

// Add this new function for factor analysis (simplified version)
export function calculateFactorAnalysis(data: any[], variables: string[]): any {
  // This is a placeholder for factor analysis
  // In a real implementation, you would use a library like ml-pca or implement the algorithm
  return {
    message: "Factor analysis placeholder. Implement or use a library for actual calculations.",
  };
}
