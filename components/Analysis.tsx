"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { calculateDescriptiveStats, calculateCronbachAlpha, calculateCorrelation, calculateFactorAnalysis, calculateFullReliabilityAnalysis } from "@/lib/statistics";
import { AnalysisTypeSelector } from "@/components/analysis-type-selector";
import { VariableSelector } from "@/components/variable-selector";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  calculateTTest, 
  calculateANOVA, 
  calculateRegressionAnalysis 
} from "@/lib/advanced-statistics";
import { ReliabilityAnalysis } from "@/components/reliability-analysis";
import { FactorAnalysis } from "@/components/factor-analysis";
interface AnalysisProps {
  data: any[];
}

interface QuestionGroup {
  id: string;
  name: string;
  englishName: string;
  questions: { id: string; text: string }[];
}

// Add this type for better error handling
interface AnalysisError {
  groupId: string;
  error: string;
}

export default function Analysis({ data }: AnalysisProps) {
  const { toast } = useToast();
  const [selectedAnalysis, setSelectedAnalysis] = useState("");
  const [selectedVariables, setSelectedVariables] = useState<string[]>([]);
  const [results, setResults] = useState<any>(null);
  const [autoMode, setAutoMode] = useState(false);
  const [groupResults, setGroupResults] = useState<Record<string, any>>({});

  const columns = data.length ? Object.keys(data[0]).filter(key => !key.endsWith('_fulltext')) : [];
  
  const detectQuestionGroups = (): QuestionGroup[] => {
    const groups: Record<string, QuestionGroup> = {};

    columns.forEach(column => {
      const fullText = data[0][`${column}_fulltext`];
      if (fullText) {
        const match = fullText.match(/^([^(]+)\s*\(([^)]+)\)\s*\[/);
        if (match) {
          const thaiName = match[1].trim();
          const englishName = match[2].trim();
          const groupKey = englishName.toUpperCase().slice(0, 3);

          if (!groups[groupKey]) {
            groups[groupKey] = {
              id: groupKey,
              name: thaiName,
              englishName: englishName,
              questions: []
            };
          }
          groups[groupKey].questions.push({ id: column, text: fullText });
        }
      }
    });

    return Object.values(groups).map(group => ({
      ...group,
      questions: group.questions.sort((a, b) => {
        const numA = parseInt(a.id.slice(3));
        const numB = parseInt(b.id.slice(3));
        return numA - numB;
      })
    }));
  };

  const questionGroups = detectQuestionGroups();

  // Reset results when analysis type changes
  useEffect(() => {
    setResults(null);
    setGroupResults({});
  }, [selectedAnalysis]);

  const handleVariableToggle = (variable: string) => {
    setSelectedVariables(prev =>
      prev.includes(variable)
        ? prev.filter(v => v !== variable)
        : [...prev, variable]
    );
  };

  const runAnalysis = () => {
    try {
      if (autoMode) {
        const newGroupResults: Record<string, any> = {};
        const errors: AnalysisError[] = [];

        questionGroups.forEach(group => {
          try {
            const groupVariables = group.questions.map(q => q.id);
            
            // Validate minimum number of variables
            if (groupVariables.length < 2 && ['cronbach', 'factor'].includes(selectedAnalysis)) {
              throw new Error(`At least 2 variables are required for ${selectedAnalysis} analysis`);
            }

            switch (selectedAnalysis) {
              case "descriptive":
                const stats = groupVariables.map(variable => ({
                  variable,
                  ...calculateDescriptiveStats(data, variable),
                })).filter(stat => stat !== null);
                
                if (stats.length === 0) {
                  throw new Error("No valid data for descriptive statistics");
                }
                newGroupResults[group.id] = stats;
                break;

              case "cronbach":
                const cronbachResult = calculateFullReliabilityAnalysis(data, groupVariables);
                if (!cronbachResult) {
                  throw new Error("Unable to calculate Cronbach's Alpha");
                }
                newGroupResults[group.id] = cronbachResult;
                break;

              case "correlation":
                const correlationResult = calculateCorrelationMatrix(
                  data.map(row => 
                    groupVariables.map(v => parseFloat(row[v]))
                  ).filter(row => row.every(v => !isNaN(v)))
                );
                if (!correlationResult) {
                  throw new Error("Unable to calculate correlations");
                }
                newGroupResults[group.id] = correlationResult;
                break;

              case "factor":
                try {
                  const groupVariables = group.questions.map(q => q.id);
                  
                  // Validate number of variables
                  if (groupVariables.length < 2) {
                    throw new Error(`Group ${group.id} needs at least 2 variables for factor analysis`);
                  }

                  // Create numerical matrix and validate data
                  const numericData = data
                    .map(row => ({
                      values: groupVariables.map(v => parseFloat(row[v])),
                      isValid: true
                    }))
                    .filter(row => row.values.every(v => !isNaN(v) && isFinite(v)))
                    .map(row => row.values);

                  // Check sample size
                  if (numericData.length < groupVariables.length * 5) {
                    throw new Error(
                      `Insufficient sample size in group ${group.id}. ` +
                      `Need at least ${groupVariables.length * 5} valid cases, ` +
                      `but only have ${numericData.length}.`
                    );
                  }

                  // Calculate variances to check for constant variables
                  const variances = groupVariables.map((_, i) => {
                    const column = numericData.map(row => row[i]);
                    const columnMean = column.reduce((sum, val) => sum + val, 0) / column.length;
                    return column.reduce((sum, val) => sum + Math.pow(val - columnMean, 2), 0) / column.length;
                  });

                  if (variances.some(v => v < 1e-10)) {
                    throw new Error(`Group ${group.id} has one or more constant variables`);
                  }

                  // Run factor analysis
                  const factorResult = calculateFactorAnalysis(data, groupVariables);
                  
                  if (!factorResult) {
                    throw new Error(`Factor analysis failed for group ${group.id}`);
                  }

                  // Validate factor analysis results
                  if (!factorResult.kmo || !factorResult.bartlett || !factorResult.communalities) {
                    throw new Error(`Invalid factor analysis results for group ${group.id}`);
                  }

                  newGroupResults[group.id] = factorResult;

                } catch (error) {
                  const errorMessage = error instanceof Error ? error.message : "Factor analysis failed";
                  console.error(`Factor analysis error in group ${group.id}:`, error);
                  errors.push({
                    groupId: group.id,
                    error: errorMessage
                  });
                  // Continue with next group
                  return;
                }
                break;
            }
          } catch (error) {
            errors.push({
              groupId: group.id,
              error: error.message || "Analysis failed"
            });
          }
        });

        // Show errors if any
        if (errors.length > 0) {
          errors.forEach(error => {
            toast({
              title: `Error in group ${error.groupId}`,
              description: error.error,
              variant: "destructive",
            });
          });
        }

        setGroupResults(newGroupResults);
      } else {
        if (!selectedVariables.length) {
          toast({
            title: "Error",
            description: "Please select at least one variable",
            variant: "destructive",
          });
          return;
        }

        switch (selectedAnalysis) {
          case "descriptive":
            const stats = selectedVariables.map(variable => ({
              variable,
              ...calculateDescriptiveStats(data, variable),
            })).filter(stat => stat !== null);
            setResults({ type: "descriptive", data: stats });
            break;
          case "cronbach":
            if (selectedVariables.length < 2) {
              toast({
                title: "Error",
                description: "Cronbach's Alpha requires at least 2 variables",
                variant: "destructive",
              });
              return;
            }
            const cronbachResult = calculateCronbachAlpha(data, selectedVariables);
            setResults({
              type: "cronbach",
              data: cronbachResult,
            });
            break;
          case "correlation":
            if (selectedVariables.length !== 2) {
              toast({
                title: "Error",
                description: "Correlation analysis requires exactly 2 variables",
                variant: "destructive",
              });
              return;
            }
            const correlation = calculateCorrelation(
              data.map(row => parseFloat(row[selectedVariables[0]])),
              data.map(row => parseFloat(row[selectedVariables[1]]))
            );
            setResults({
              type: "correlation",
              data: { correlation: correlation.toFixed(3) },
            });
            break;
          case "factor":
            setResults({
              type: "factor",
              data: calculateFactorAnalysis(data, selectedVariables),
            });
            break;
          case "ttest":
            if (selectedVariables.length !== 2) {
              toast({
                title: "Error",
                description: "T-Test requires exactly 2 groups",
                variant: "destructive",
              });
              return;
            }
            const group1 = data.map(row => parseFloat(row[selectedVariables[0]])).filter(v => !isNaN(v));
            const group2 = data.map(row => parseFloat(row[selectedVariables[1]])).filter(v => !isNaN(v));
            const tTestResult = calculateTTest(group1, group2);
            setResults({
              type: "ttest",
              data: tTestResult
            });
            break;
          case "anova":
            const groups = selectedVariables.map(variable => 
              data.map(row => parseFloat(row[variable])).filter(v => !isNaN(v))
            );
            const anovaResult = calculateANOVA(groups);
            setResults({
              type: "anova",
              data: anovaResult
            });
            break;
          case "regression":
            if (selectedVariables.length !== 2) {
              toast({
                title: "Error",
                description: "Regression analysis requires exactly 2 variables",
                variant: "destructive",
              });
              return;
            }
            const xValues = data.map(row => parseFloat(row[selectedVariables[0]])).filter(v => !isNaN(v));
            const yValues = data.map(row => parseFloat(row[selectedVariables[1]])).filter(v => !isNaN(v));
            const regressionResult = calculateRegressionAnalysis(xValues, yValues);
            setResults({
              type: "regression",
              data: regressionResult
            });
            break;
          default:
            toast({
              title: "Error",
              description: "Please select an analysis type",
              variant: "destructive",
            });
        }
      }
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: "Error",
        description: error.message || "An error occurred while performing the analysis",
        variant: "destructive",
      });
    }
  };

  const calculateCorrelationMatrix = (data: any[], variables: string[]) => {
    const matrix: Record<string, Record<string, number>> = {};
    variables.forEach(var1 => {
      matrix[var1] = {};
      variables.forEach(var2 => {
        try {
          matrix[var1][var2] = calculateCorrelation(
            data.map(row => parseFloat(row[var1])),
            data.map(row => parseFloat(row[var2]))
          );
        } catch (error) {
          console.error(`Error calculating correlation between ${var1} and ${var2}:`, error);
          matrix[var1][var2] = NaN;
        }
      });
    });
    return matrix;
  };

  const renderDescriptiveStatsTable = (stats: any[] | undefined) => {
    if (!stats || !Array.isArray(stats) || stats.length === 0) {
      return <p>No descriptive statistics data available.</p>;
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Variable</TableHead>
            <TableHead>N</TableHead>
            <TableHead>Mean</TableHead>
            <TableHead>Std. Deviation</TableHead>
            <TableHead>Minimum</TableHead>
            <TableHead>Maximum</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stats.map((stat, index) => (
            <TableRow key={index}>
              <TableCell>{stat.variable}</TableCell>
              <TableCell>{stat.n}</TableCell>
              <TableCell>{stat.mean}</TableCell>
              <TableCell>{stat.stdDev}</TableCell>
              <TableCell>{stat.min}</TableCell>
              <TableCell>{stat.max}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  const renderCorrelationMatrix = (matrix: Record<string, Record<string, number>> | undefined) => {
    if (!matrix) {
      return <p>No correlation data available.</p>;
    }

    const variables = Object.keys(matrix);

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead></TableHead>
            {variables.map(key => <TableHead key={key}>{key}</TableHead>)}
          </TableRow>
        </TableHeader>
        <TableBody>
          {variables.map(row => (
            <TableRow key={row}>
              <TableCell>{row}</TableCell>
              {variables.map(col => (
                <TableCell key={col}>
                  {isNaN(matrix[row][col]) ? 'N/A' : matrix[row][col].toFixed(3)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  const renderCronbachAlpha = (result: any) => {
    if (!result) {
      return <p>No data available for Cronbach's Alpha calculation.</p>;
    }
    
    const fullAnalysis = calculateFullReliabilityAnalysis(data, selectedVariables);
    return <ReliabilityAnalysis data={fullAnalysis} />;
  };

  const renderTTest = (result: any) => (
    <Table>
      <TableBody>
        <TableRow>
          <TableCell>t-value</TableCell>
          <TableCell>{result.tValue.toFixed(3)}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>p-value</TableCell>
          <TableCell>{result.pValue.toFixed(3)}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Degrees of Freedom</TableCell>
          <TableCell>{result.degreesOfFreedom}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );

  const renderANOVA = (result: any) => (
    <Table>
      <TableBody>
        <TableRow>
          <TableCell>F-value</TableCell>
          <TableCell>{result.fValue.toFixed(3)}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>p-value</TableCell>
          <TableCell>{result.pValue.toFixed(3)}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>df between</TableCell>
          <TableCell>{result.dfBetween}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>df within</TableCell>
          <TableCell>{result.dfWithin}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );

  const renderRegression = (result: any) => (
    <Table>
      <TableBody>
        <TableRow>
          <TableCell>Slope (β)</TableCell>
          <TableCell>{result.slope.toFixed(3)}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Intercept (α)</TableCell>
          <TableCell>{result.intercept.toFixed(3)}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>R-squared</TableCell>
          <TableCell>{result.rSquared.toFixed(3)}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Standard Error</TableCell>
          <TableCell>{result.standardError.toFixed(3)}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );

  if (!data.length) {
    return (
      <div className="flex h-[400px] items-center justify-center text-muted-foreground">
        Import data to perform statistical analysis.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Switch
          id="auto-mode"
          checked={autoMode}
          onCheckedChange={(checked) => {
            setAutoMode(checked);
            setResults(null);
            setGroupResults({});
          }}
        />
        <Label htmlFor="auto-mode">Auto Mode</Label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <AnalysisTypeSelector onValueChange={setSelectedAnalysis} />
        {!autoMode && (
          <VariableSelector
            variables={columns}
            selectedVariables={selectedVariables}
            onVariableToggle={handleVariableToggle}
          />
        )}
      </div>

      <Button onClick={runAnalysis}>Run Analysis</Button>

      {autoMode && (
        <div className="grid grid-cols-1 gap-4">
          {questionGroups.map((group) => {
            // Check if we have any valid results for this group
            const groupResult = groupResults[group.id];
            const hasValidResults = groupResult && (
              (selectedAnalysis === "descriptive" && Array.isArray(groupResult) && groupResult.length > 0) ||
              (selectedAnalysis === "cronbach" && groupResult.reliabilityStats) ||
              (selectedAnalysis === "correlation" && Object.keys(groupResult).length > 0) ||
              (selectedAnalysis === "factor" && groupResult.kmo)
            );

            return (
              <Card key={group.id}>
                <CardHeader>
                  <CardTitle>
                    {group.name} ({group.englishName})
                    {!hasValidResults && (
                      <span className="text-sm text-muted-foreground ml-2">
                        (No valid results)
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!hasValidResults ? (
                    <div className="text-muted-foreground">
                      Unable to perform analysis on this group. This might be due to:
                      <ul className="list-disc list-inside mt-2">
                        <li>Insufficient valid data</li>
                        <li>Too few variables for the selected analysis</li>
                        <li>High correlation between variables</li>
                        <li>Missing or invalid values</li>
                      </ul>
                    </div>
                  ) : selectedAnalysis === "descriptive" ? (
                    renderDescriptiveStatsTable(groupResult)
                  ) : selectedAnalysis === "cronbach" ? (
                    <ReliabilityAnalysis data={groupResult} />
                  ) : selectedAnalysis === "correlation" ? (
                    renderCorrelationMatrix(groupResult)
                  ) : selectedAnalysis === "factor" ? (
                    <FactorAnalysis data={groupResult} />
                  ) : (
                    <div className="text-muted-foreground">
                      Unsupported analysis type
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!autoMode && results && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
          </CardHeader>
          <CardContent>
            {results.type === "descriptive" && renderDescriptiveStatsTable(results.data)}
            {results.type === "cronbach" && renderCronbachAlpha(results.data as { 
              alpha: number, 
              itemTotalCorrelations: Record<string, number>,
              alphaIfItemDeleted: Record<string, number> 
            } | undefined)}
            {results.type === "correlation" && (
              <p>Correlation: {results.data.correlation}</p>
            )}
            {results.type === "factor" && (
              <pre>{JSON.stringify(results.data, null, 2)}</pre>
            )}
            {results.type === "ttest" && renderTTest(results.data)}
            {results.type === "anova" && renderANOVA(results.data)}
            {results.type === "regression" && renderRegression(results.data)}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
