export class Matrix {
  private data: number[][];
  public rows: number;
  public cols: number;

  constructor(data: number[][] | [number, number]) {
    if (Array.isArray(data[0])) {
      // If input is a 2D array
      this.data = data as number[][];
      this.rows = this.data.length;
      this.cols = this.data[0]?.length || 0;
    } else {
      // If input is dimensions [rows, cols]
      const dimensions = data as [number, number];
      this.rows = dimensions[0];
      this.cols = dimensions[1];
      this.data = Array(this.rows).fill(0).map(() => Array(this.cols).fill(0));
    }
  }

  static fromDimensions(rows: number, cols: number): Matrix {
    return new Matrix([rows, cols]);
  }

  static eye(n: number): Matrix {
    const data = Array(n).fill(0).map((_, i) => 
      Array(n).fill(0).map((_, j) => i === j ? 1 : 0)
    );
    return new Matrix(data);
  }

  get(i: number, j: number): number {
    return this.data[i][j];
  }

  set(i: number, j: number, value: number): void {
    this.data[i][j] = value;
  }

  // Fixed subMatrix method
  subMatrix(rows: number[], cols: number[]): Matrix {
    // Ensure indices are valid
    if (!rows.length || !cols.length) {
      throw new Error("Empty row or column selection");
    }
    
    if (rows.some(i => i < 0 || i >= this.rows) || 
        cols.some(j => j < 0 || j >= this.cols)) {
      throw new Error("Index out of bounds");
    }

    // Create new matrix with selected rows and columns
    const newData = rows.map(i => 
      cols.map(j => this.data[i][j])
    );

    return new Matrix(newData);
  }

  determinant(): number {
    if (this.rows !== this.cols) {
      throw new Error("Matrix must be square");
    }
    if (this.rows === 1) return this.data[0][0];
    if (this.rows === 2) {
      return this.data[0][0] * this.data[1][1] - this.data[0][1] * this.data[1][0];
    }

    let det = 0;
    for (let j = 0; j < this.cols; j++) {
      const subMatrixRows = Array.from({ length: this.rows - 1 }, (_, i) => i + 1);
      const subMatrixCols = [...Array(j).keys(), ...Array(this.cols - j - 1).keys().map(i => i + j + 1)];
      det += Math.pow(-1, j) * this.data[0][j] * this.subMatrix(subMatrixRows, subMatrixCols).determinant();
    }
    return det;
  }

  inverse(): Matrix {
    if (this.rows !== this.cols) {
      throw new Error("Matrix must be square");
    }

    const n = this.rows;
    const augmented = new Matrix(
      this.data.map((row, i) => 
        [...row, ...Array(n).fill(0).map((_, j) => i === j ? 1 : 0)]
      )
    );

    // Gauss-Jordan elimination
    for (let i = 0; i < n; i++) {
      let pivot = augmented.data[i][i];
      if (Math.abs(pivot) < 1e-10) {
        throw new Error("Matrix is singular");
      }

      // Normalize row i
      for (let j = 0; j < 2 * n; j++) {
        augmented.data[i][j] /= pivot;
      }

      // Eliminate column i from all other rows
      for (let k = 0; k < n; k++) {
        if (k !== i) {
          const factor = augmented.data[k][i];
          for (let j = 0; j < 2 * n; j++) {
            augmented.data[k][j] -= factor * augmented.data[i][j];
          }
        }
      }
    }

    // Extract right half of augmented matrix
    return new Matrix(
      augmented.data.map(row => row.slice(n))
    );
  }

  transpose(): Matrix {
    const newData = Array(this.cols).fill(0).map((_, i) =>
      Array(this.rows).fill(0).map((_, j) => this.data[j][i])
    );
    return new Matrix(newData);
  }

  multiply(scalar: number): Matrix {
    const newData = this.data.map(row =>
      row.map(val => val * scalar)
    );
    return new Matrix(newData);
  }

  clone(): Matrix {
    return new Matrix(this.data.map(row => [...row]));
  }

  sub(other: Matrix): Matrix {
    if (this.rows !== other.rows || this.cols !== other.cols) {
      throw new Error("Matrices must have same dimensions");
    }
    const newData = this.data.map((row, i) =>
      row.map((val, j) => val - other.get(i, j))
    );
    return new Matrix(newData);
  }

  norm(): number {
    return Math.sqrt(this.data.reduce((sum, row) =>
      sum + row.reduce((s, val) => s + val * val, 0), 0
    ));
  }

  to2DArray(): number[][] {
    return this.data.map(row => [...row]);
  }
}

export class EVD {
  public realEigenvalues: number[];
  public eigenvectorMatrix: Matrix;

  constructor(matrix: Matrix) {
    // Power iteration method for simplicity
    // Note: This is a simplified implementation
    const n = matrix.rows;
    this.realEigenvalues = Array(n).fill(0);
    const eigenvectors = Array(n).fill(0).map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      let vector = Array(n).fill(0);
      vector[i] = 1;
      
      // Power iteration
      for (let iter = 0; iter < 100; iter++) {
        const newVector = this.matrixVectorMultiply(matrix.to2DArray(), vector);
        const norm = Math.sqrt(newVector.reduce((s, v) => s + v * v, 0));
        vector = newVector.map(v => v / norm);
      }

      // Calculate eigenvalue
      const Av = this.matrixVectorMultiply(matrix.to2DArray(), vector);
      this.realEigenvalues[i] = this.dotProduct(vector, Av);
      eigenvectors[i] = vector;
    }

    this.eigenvectorMatrix = new Matrix(eigenvectors);
  }

  private matrixVectorMultiply(matrix: number[][], vector: number[]): number[] {
    return matrix.map(row =>
      row.reduce((sum, val, j) => sum + val * vector[j], 0)
    );
  }

  private dotProduct(v1: number[], v2: number[]): number {
    return v1.reduce((sum, val, i) => sum + val * v2[i], 0);
  }
}
