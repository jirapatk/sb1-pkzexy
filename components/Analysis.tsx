"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { calculateDescriptiveStats, calculateCronbachAlpha, calculateCorrelation, calculateFactorAnalysis } from "@/lib/statistics";
import { AnalysisTypeSelector } from "@/components/analysis-type-selector";
import { VariableSelector } from "@/components/variable-selector";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface AnalysisProps {
  data: any[];
}

interface QuestionGroup {
  id: string;
  name: string;
  englishName: string;
  questions: { id: string; text: string }[];
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
        questionGroups.forEach(group => {
          const groupVariables = group.questions.map(q => q.id);
          switch (selectedAnalysis) {
            case "descriptive":
              newGroupResults[group.id] = groupVariables.map(variable => ({
                variable,
                ...calculateDescriptiveStats(data, variable),
              })).filter(stat => stat !== null);
              break;
            case "cronbach":
              newGroupResults[group.id] = calculateCronbachAlpha(data, groupVariables);
              break;
            case "correlation":
              newGroupResults[group.id] = calculateCorrelationMatrix(data, groupVariables);
              break;
            case "factor":
              newGroupResults[group.id] = calculateFactorAnalysis(data, groupVariables);
              break;
          }
        });
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
        description: "An error occurred while performing the analysis",
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

  const renderCronbachAlpha = (result: { alpha: number, itemTotalCorrelations: Record<string, number> } | undefined) => {
    if (!result) {
      return <p>No data available for Cronbach's Alpha calculation.</p>;
    }
    return (
      <div>
        <p>Cronbach's Alpha: {result.alpha.toFixed(3)}</p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Item-Total Correlation</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(result.itemTotalCorrelations).map(([variable, correlation]) => (
              <TableRow key={variable}>
                <TableCell>{variable}</TableCell>
                <TableCell>{typeof correlation === 'number' ? correlation.toFixed(3) : 'N/A'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

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
          {questionGroups.map((group) => (
            <Card key={group.id}>
              <CardHeader>
                <CardTitle>{group.name} ({group.englishName})</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedAnalysis === "descriptive" && groupResults[group.id] && 
                  renderDescriptiveStatsTable(Array.isArray(groupResults[group.id]) ? groupResults[group.id] : undefined)}
                {selectedAnalysis === "cronbach" && groupResults[group.id] && 
                  renderCronbachAlpha(groupResults[group.id] as { alpha: number, itemTotalCorrelations: Record<string, number> } | undefined)}
                {selectedAnalysis === "correlation" && 
                  renderCorrelationMatrix(groupResults[group.id])}
                {selectedAnalysis === "factor" && (
                  <pre>{JSON.stringify(groupResults[group.id], null, 2)}</pre>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!autoMode && results && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
          </CardHeader>
          <CardContent>
            {results.type === "descriptive" && renderDescriptiveStatsTable(results.data)}
            {results.type === "cronbach" && renderCronbachAlpha(results.data as { alpha: number, itemTotalCorrelations: Record<string, number> } | undefined)}
            {results.type === "correlation" && (
              <p>Correlation: {results.data.correlation}</p>
            )}
            {results.type === "factor" && (
              <pre>{JSON.stringify(results.data, null, 2)}</pre>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
