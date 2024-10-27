"use client";
// Move these functions to the top and export them
export function mean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function variance(values: number[]): number {
  const m = mean(values);
  return values.reduce((sum, x) => sum + Math.pow(x - m, 2), 0) / values.length;
}

export function calculateCronbachAlpha(data: any[], variables: string[]): { 
  alpha: number, 
  itemTotalCorrelations: Record<string, number>,
  alphaIfItemDeleted: Record<string, number>  // Add this new property
} | undefined {
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
    const alphaIfItemDeleted: Record<string, number> = {};  // Add this new object

    // Calculate alpha if item deleted and item-total correlations
    variables.forEach((variable, index) => {
      // Calculate item-total correlation
      const itemScores = matrix.map(row => row[index]);
      const totalScores = matrix.map(row => row.reduce((a, b) => a + b, 0) - row[index]);
      itemTotalCorrelations[variable] = calculateCorrelation(itemScores, totalScores);

      // Calculate alpha if item deleted
      const reducedVariables = matrix.map(row => 
        row.filter((_, colIndex) => colIndex !== index)
      );
      
      const reducedRowSums = reducedVariables.map(row => 
        row.reduce((a, b) => a + b, 0)
      );
      
      const reducedItemVariances = Array(k - 1).fill(0).map((_, j) => {
        const column = reducedVariables.map(row => row[j]);
        return variance(column);
      });

      const reducedTotalVariance = variance(reducedRowSums);
      const reducedItemVarianceSum = reducedItemVariances.reduce((a, b) => a + b, 0);
      
      alphaIfItemDeleted[variable] = ((k - 1) / (k - 2)) * 
        (1 - (reducedItemVarianceSum / reducedTotalVariance));
    });

    return { 
      alpha, 
      itemTotalCorrelations,
      alphaIfItemDeleted  // Include in return object
    };
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
export function calculateFactorAnalysis(data: any[], variables: string[]) {
  try {
    // Convert data to numerical matrix
    const matrix = data
      .map(row => variables.map(v => parseFloat(row[v])))
      .filter(row => row.every(v => !isNaN(v)));

    if (matrix.length === 0) {
      throw new Error("No valid data for analysis");
    }

    // Calculate correlation matrix
    const correlationMatrix = variables.map((v1, i) => 
      variables.map((v2, j) => {
        const col1 = matrix.map(row => row[i]);
        const col2 = matrix.map(row => row[j]);
        return calculateCorrelation(col1, col2);
      })
    );

    // Calculate KMO and Bartlett's test
    const kmoResult = calculateKMO(correlationMatrix);
    const bartlettResult = calculateBartlettTest(correlationMatrix, matrix.length);

    // Calculate eigenvalues and eigenvectors
    const { eigenvalues, eigenvectors } = powerIteration(correlationMatrix, variables.length);

    // Calculate communalities
    const communalities = variables.map((variable, i) => ({
      variable,
      initial: 1,
      extraction: eigenvectors[i].reduce((sum, loading) => sum + Math.pow(loading, 2), 0)
    }));

    // Calculate total variance explained
    const totalVariance = eigenvalues.map((eigenvalue, i) => {
      const percentOfVariance = (eigenvalue / eigenvalues.reduce((a, b) => a + b, 0)) * 100;
      const cumulative = eigenvalues
        .slice(0, i + 1)
        .reduce((sum, val) => sum + (val / eigenvalues.reduce((a, b) => a + b, 0)) * 100, 0);

      return {
        component: i + 1,
        initialEigenvalues: {
          total: eigenvalue,
          percentOfVariance,
          cumulative
        },
        extractionSums: eigenvalue > 1 ? {
          total: eigenvalue,
          percentOfVariance,
          cumulative
        } : null
      };
    });

    // Create component matrix
    const componentMatrix: Record<string, Record<string, number>> = {};
    variables.forEach((variable, i) => {
      componentMatrix[variable] = {};
      eigenvectors[i].forEach((loading, j) => {
        componentMatrix[variable][`Component${j + 1}`] = loading;
      });
    });

    // Format correlation matrix
    const formattedCorrelationMatrix: Record<string, Record<string, number>> = {};
    variables.forEach((v1, i) => {
      formattedCorrelationMatrix[v1] = {};
      variables.forEach((v2, j) => {
        formattedCorrelationMatrix[v1][v2] = correlationMatrix[i][j];
      });
    });

    return {
      kmo: kmoResult,
      bartlett: bartlettResult,
      communalities,
      totalVariance,
      componentMatrix,
      correlationMatrix: formattedCorrelationMatrix
    };

  } catch (error) {
    console.error("Factor analysis error:", error);
    return null;
  }
}

// Update the powerIteration function
function powerIteration(matrix: number[][], n: number) {
  try {
    const eigenvalues: number[] = [];
    const eigenvectors: number[][] = [];
    let remainingMatrix = matrix.map(row => [...row]);

    for (let k = 0; k < n; k++) {
      // Initialize vector
      let vector = Array(n).fill(0).map((_, i) => i === k ? 1 : 0);
      
      // Power iteration
      for (let iter = 0; iter < 100; iter++) {
        // Matrix-vector multiplication
        const newVector = remainingMatrix.map(row =>
          row.reduce((sum, val, i) => sum + val * vector[i], 0)
        );
        
        // Normalize
        const norm = Math.sqrt(newVector.reduce((sum, v) => sum + v * v, 0));
        vector = newVector.map(v => v / (norm || 1)); // Avoid division by zero
      }

      // Calculate eigenvalue
      const eigenvalue = vector.reduce((sum, v, i) =>
        sum + v * remainingMatrix[i].reduce((s, m, j) => s + m * vector[j], 0), 0
      );

      eigenvalues.push(Math.abs(eigenvalue)); // Use absolute value for stability
      eigenvectors.push(vector);

      // Deflate matrix
      remainingMatrix = remainingMatrix.map((row, i) =>
        row.map((val, j) => val - eigenvalue * vector[i] * vector[j])
      );
    }

    return {
      eigenvalues,
      eigenvectors: eigenvectors.map((_, i) => 
        eigenvectors.map(v => v[i])
      )
    };
  } catch (error) {
    console.error("Power iteration error:", error);
    throw new Error("Failed to calculate eigenvalues and eigenvectors");
  }
}

// Add these helper functions for matrix operations
function matrixMultiply(a: number[][], b: number[][]): number[][] {
  const result: number[][] = Array(a.length).fill(0)
    .map(() => Array(b[0].length).fill(0));
  
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b[0].length; j++) {
      for (let k = 0; k < b.length; k++) {
        result[i][j] += a[i][k] * b[k][j];
      }
    }
  }
  return result;
}

function matrixTranspose(matrix: number[][]): number[][] {
  return matrix[0].map((_, i) => matrix.map(row => row[i]));
}

function matrixDeterminant(matrix: number[][]): number {
  const n = matrix.length;
  if (n === 1) return matrix[0][0];
  if (n === 2) return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
  
  let det = 0;
  for (let j = 0; j < n; j++) {
    det += Math.pow(-1, j) * matrix[0][j] * matrixDeterminant(
      matrix.slice(1).map(row => [...row.slice(0, j), ...row.slice(j + 1)])
    );
  }
  return det;
}

function matrixInverse(matrix: number[][]): number[][] {
  const n = matrix.length;
  const det = matrixDeterminant(matrix);
  if (Math.abs(det) < 1e-10) throw new Error("Matrix is singular");

  const cofactors = matrix.map((row, i) =>
    row.map((_, j) => {
      const minor = matrix
        .filter((_, index) => index !== i)
        .map(row => [...row.slice(0, j), ...row.slice(j + 1)]);
      return Math.pow(-1, i + j) * matrixDeterminant(minor);
    })
  );

  const adjugate = matrixTranspose(cofactors);
  return adjugate.map(row => row.map(val => val / det));
}

// Update the calculateKMO function to use these simpler matrix operations
function calculateKMO(correlationMatrix: number[][]): {
  overall: number;
  individual: Record<string, number>;
} {
  try {
    const n = correlationMatrix.length;
    if (n < 2) {
      throw new Error("Need at least 2 variables for KMO calculation");
    }

    const partialCorr: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));
    
    // Calculate partial correlations
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        try {
          const others = Array.from({length: n}, (_, k) => k)
            .filter(k => k !== i && k !== j);
            
          if (others.length > 0) {
            const subMatrix = others.map(r => 
              others.map(c => correlationMatrix[r][c])
            );
            const inverse = matrixInverse(subMatrix);
            const partial = -correlationMatrix[i][j] / 
              Math.sqrt(correlationMatrix[i][i] * correlationMatrix[j][j]);
            
            partialCorr[i][j] = partial;
            partialCorr[j][i] = partial;
          }
        } catch (error) {
          console.error(`Error in partial correlation ${i},${j}:`, error);
          partialCorr[i][j] = 0;
          partialCorr[j][i] = 0;
        }
      }
    }

    // Calculate KMO statistics
    let sumR = 0;
    let sumQ = 0;
    const individual: Record<string, number> = {};

    for (let i = 0; i < n; i++) {
      let rowR = 0;
      let rowQ = 0;
      for (let j = 0; j < n; j++) {
        if (i !== j) {
          rowR += Math.pow(correlationMatrix[i][j], 2);
          rowQ += Math.pow(partialCorr[i][j], 2);
        }
      }
      individual[`var${i}`] = rowR / (rowR + rowQ);
      sumR += rowR;
      sumQ += rowQ;
    }

    const overall = sumR / (sumR + sumQ);
    return {
      overall: Math.max(0, Math.min(1, overall)),
      individual
    };
  } catch (error) {
    console.error("Error in KMO calculation:", error);
    throw error;
  }
}

function calculateBartlettTest(correlationMatrix: number[][], n: number) {
  const matrixSize = correlationMatrix.length;
  const matrixObj = MatrixOperations.from(correlationMatrix);
  const determinant = matrixObj.determinant();
  const chiSquare = -(n - 1 - (2 * matrixSize + 5) / 6) * Math.log(determinant);
  const degreesOfFreedom = (matrixSize * (matrixSize - 1)) / 2;
  const significance = 1 - chiSquareCDF(chiSquare, degreesOfFreedom);

  return {
    chiSquare,
    degreesOfFreedom,
    significance
  };
}

function calculateCommunalities(eigenvectors: number[][], variables: string[]) {
  return variables.map((variable, i) => ({
    variable,
    initial: 1, // Initial communalities are 1 for principal components
    extraction: eigenvectors[i].reduce((sum, loading) => sum + Math.pow(loading, 2), 0)
  }));
}

function calculateTotalVariance(eigenvalues: number[], n: number) {
  const total = eigenvalues.reduce((sum, val) => sum + val, 0);
  let cumulativePercent = 0;

  return eigenvalues.map((eigenvalue, i) => {
    const percentOfVariance = (eigenvalue / total) * 100;
    cumulativePercent += percentOfVariance;
    
    return {
      component: i + 1,
      initialEigenvalues: {
        total: eigenvalue,
        percentOfVariance,
        cumulative: cumulativePercent
      },
      extractionSums: {
        total: eigenvalue,
        percentOfVariance,
        cumulative: cumulativePercent
      }
    };
  });
}

function calculateComponentMatrix(eigenvectors: number[][], variables: string[]) {
  const componentMatrix: Record<string, Record<string, number>> = {};
  
  variables.forEach((variable, i) => {
    componentMatrix[variable] = {};
    eigenvectors[i].forEach((loading, j) => {
      componentMatrix[variable][`component${j + 1}`] = loading;
    });
  });
  
  return componentMatrix;
}

function calculateVarimaxRotation(componentMatrix: ComponentMatrix): ComponentMatrix {
  const variables = Object.keys(componentMatrix);
  const components = Object.keys(componentMatrix[variables[0]]);
  const matrix = variables.map(v => components.map(c => componentMatrix[v][c]));
  
  const maxIterations = 100;
  const tolerance = 1e-6;
  let rotation = MatrixOperations.eye(components.length);
  
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    let prevRotation = rotation.clone();
    
    for (let i = 0; i < components.length - 1; i++) {
      for (let j = i + 1; j < components.length; j++) {
        let num = 0;
        let den = 0;
        for (let k = 0; k < variables.length; k++) {
          const x = matrix[k][i];
          const y = matrix[k][j];
          num += 2 * x * y;
          den += x * x - y * y;
        }
        const theta = Math.atan2(num, den) / 4;
        
        const c = Math.cos(theta);
        const s = Math.sin(theta);
        for (let k = 0; k < variables.length; k++) {
          const x = matrix[k][i];
          const y = matrix[k][j];
          matrix[k][i] = c * x - s * y;
          matrix[k][j] = s * x + c * y;
        }
      }
    }
    
    const diff = rotation.sub(prevRotation).norm();
    if (diff < tolerance) break;
  }
  
  const rotatedMatrix: ComponentMatrix = {};
  variables.forEach((variable, i) => {
    rotatedMatrix[variable] = {};
    components.forEach((component, j) => {
      rotatedMatrix[variable][component] = matrix[i][j];
    });
  });
  
  return rotatedMatrix;
}

// Replace the existing chiSquareCDF function with these implementations

// Lanczos approximation for gamma function
function gamma(z: number): number {
  const p = [
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7
  ];

  if (z < 0.5) {
    return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
  }

  z -= 1;
  let x = 0.99999999999980993;
  for (let i = 0; i < p.length; i++) {
    x += p[i] / (z + i + 1);
  }

  const t = z + p.length - 0.5;
  return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}

// Incomplete gamma function (lower)
function lowerGamma(s: number, x: number): number {
  if (x <= 0) {
    return 0;
  }

  let sum = 0;
  let term = 1 / s;
  let iteration = 0;
  
  while (iteration < 100) { // Maximum iterations
    sum += term;
    term *= x / (s + iteration + 1);
    
    if (Math.abs(term) < 1e-10) { // Convergence threshold
      break;
    }
    iteration++;
  }

  return Math.pow(x, s) * Math.exp(-x) * sum;
}

// Updated chi-square CDF function
function chiSquareCDF(x: number, df: number): number {
  if (x <= 0) return 0;
  return lowerGamma(df/2, x/2) / gamma(df/2);
}

function calculateCorrelationMatrix(matrix: number[][]): number[][] {
  try {
    if (!matrix || matrix.length === 0 || !matrix[0]) {
      throw new Error("Invalid input matrix");
    }

    const n = matrix[0].length; // Number of variables
    const correlationMatrix: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));
    
    // First check if we have enough data
    if (matrix.length < 3) {
      throw new Error("Need at least 3 cases for correlation analysis");
    }

    // Check for constant variables
    const variances = Array(n).fill(0).map((_, i) => 
      variance(matrix.map(row => row[i]))
    );

    if (variances.some(v => v === 0)) {
      throw new Error("One or more variables have zero variance");
    }

    // Calculate correlations
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const col1 = matrix.map(row => row[i]);
        const col2 = matrix.map(row => row[j]);
        try {
          correlationMatrix[i][j] = calculateCorrelation(col1, col2);
        } catch (error) {
          console.error(`Error calculating correlation for variables ${i} and ${j}:`, error);
          correlationMatrix[i][j] = NaN;
        }
      }
    }

    // Validate the correlation matrix
    if (correlationMatrix.some(row => row.some(val => isNaN(val)))) {
      throw new Error("Unable to calculate some correlations due to invalid data");
    }

    return correlationMatrix;
  } catch (error) {
    console.error("Error in correlation matrix calculation:", error);
    throw error;
  }
}

// Add to existing statistics.ts file

export function calculateFullReliabilityAnalysis(data: any[], variables: string[]) {
  try {
    // Convert data to numerical matrix and handle missing values
    const numericData = data.map(row => 
      variables.map(v => parseFloat(row[v]))
    ).filter(row => row.every(v => !isNaN(v)));

    const validN = numericData.length;
    const excluded = data.length - validN;
    const total = data.length;

    // Calculate item statistics
    const itemStats = variables.map(variable => {
      const values = data
        .map(row => parseFloat(row[variable]))
        .filter(v => !isNaN(v));
      
      return {
        variable,
        mean: mean(values),
        stdDev: Math.sqrt(variance(values)),
        n: values.length
      };
    });

    // Calculate inter-item correlations
    const interItemCorrelations: Record<string, Record<string, number>> = {};
    variables.forEach(var1 => {
      interItemCorrelations[var1] = {};
      variables.forEach(var2 => {
        const values1 = data.map(row => parseFloat(row[var1])).filter(v => !isNaN(v));
        const values2 = data.map(row => parseFloat(row[var2])).filter(v => !isNaN(v));
        interItemCorrelations[var1][var2] = calculateCorrelation(values1, values2);
      });
    });

    // Calculate scale statistics
    const rowSums = numericData.map(row => row.reduce((a, b) => a + b, 0));
    const scaleMean = mean(rowSums);
    const scaleVariance = variance(rowSums);
    const scaleStdDev = Math.sqrt(scaleVariance);

    // Calculate item-total statistics with correct Squared Multiple Correlation
    const itemTotalStats = variables.map(variable => {
      const values = data.map(row => parseFloat(row[variable])).filter(v => !isNaN(v));
      const otherVars = variables.filter(v => v !== variable);
      
      // Calculate multiple regression for Squared Multiple Correlation
      const otherValues = otherVars.map(v => 
        data.map(row => parseFloat(row[v])).filter(v => !isNaN(v))
      );
      
      // Calculate squared multiple correlation using multiple regression
      const squaredMultipleCorrelation = calculateSquaredMultipleCorrelation(values, otherValues);

      const totalScores = data.map(row => 
        otherVars.reduce((sum, v) => sum + (parseFloat(row[v]) || 0), 0)
      );

      const scaleAvgIfDeleted = mean(totalScores);
      const scaleVarianceIfDeleted = variance(totalScores);
      const itemTotalCorrelation = calculateCorrelation(values, totalScores);
      
      const alphaIfDeleted = calculateCronbachAlpha(
        data,
        variables.filter(v => v !== variable)
      )?.alpha || 0;

      return {
        variable,
        scaleAvgIfDeleted,
        scaleVarianceIfDeleted,
        itemTotalCorrelation,
        squaredMultipleCorrelation,
        alphaIfDeleted
      };
    });

    // Calculate overall Cronbach's Alpha
    const cronbachResult = calculateCronbachAlpha(data, variables);
    const standardizedAlpha = calculateStandardizedAlpha(interItemCorrelations);

    return {
      caseProcessingSummary: {
        validN,
        excluded,
        total
      },
      reliabilityStats: {
        cronbachAlpha: cronbachResult?.alpha || 0,
        standardizedAlpha,
        nItems: variables.length
      },
      itemStats,
      interItemCorrelations,
      itemTotalStats,
      scaleStats: {
        mean: scaleMean,
        variance: scaleVariance,
        stdDev: scaleStdDev,
        nItems: variables.length
      }
    };
  } catch (error) {
    console.error("Error in reliability analysis:", error);
    throw error;
  }
}

function calculateStandardizedAlpha(correlations: Record<string, Record<string, number>>): number {
  const variables = Object.keys(correlations);
  const n = variables.length;
  
  // Calculate average correlation
  let totalCorr = 0;
  let count = 0;
  variables.forEach((var1, i) => {
    variables.forEach((var2, j) => {
      if (i < j) {
        totalCorr += correlations[var1][var2];
        count++;
      }
    });
  });
  
  const avgCorr = totalCorr / count;
  
  // Calculate standardized alpha
  return (n * avgCorr) / (1 + (n - 1) * avgCorr);
}

// Add these interfaces at the top of the file
interface ComponentMatrix {
  [key: string]: {
    [key: string]: number;
  };
}

interface CorrelationMatrix {
  [key: string]: {
    [key: string]: number;
  };
}

// Add this new function for calculating Squared Multiple Correlation
function calculateSquaredMultipleCorrelation(dependent: number[], predictors: number[][]): number {
  try {
    const y = standardize(dependent);
    const X = predictors.map(p => standardize(p));

    const correlationMatrix = MatrixOperations.from(X.map(x => 
      X.map(x2 => calculateCorrelation(x, x2))
    ));

    const correlationVector = X.map(x => calculateCorrelation(x, y));

    try {
      const inverseCorrelation = correlationMatrix.inverse();
      const beta = inverseCorrelation.multiply(MatrixOperations.columnVector(correlationVector));
      const R2 = beta.transpose().multiply(MatrixOperations.columnVector(correlationVector)).get(0, 0);

      return Math.max(0, Math.min(1, R2));
    } catch (error) {
      return Math.pow(Math.max(...correlationVector), 2);
    }
  } catch (error) {
    console.error("Error calculating Squared Multiple Correlation:", error);
    return 0;
  }
}

// Helper function to standardize variables
function standardize(values: number[]): number[] {
  const m = mean(values);
  const sd = Math.sqrt(variance(values));
  return values.map(v => (v - m) / sd);
}

