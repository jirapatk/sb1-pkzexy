"use client";

import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/data-table";
import { ReactNode } from 'react';

interface AnalysisResultsProps {
  results: any;
  selectedVariables: string[];
  renderDescriptiveStats: (stats: any) => ReactNode;
}

export function AnalysisResults({ results, selectedVariables, renderDescriptiveStats }: AnalysisResultsProps) {
  if (!results) return null;

  switch (results.type) {
    case "descriptive":
      return (
        <div>
          {results.data.map((stat: any, index: number) => (
            <div key={index} className="mb-4">
              <h3 className="font-semibold">{selectedVariables[index]}</h3>
              {renderDescriptiveStats(stat)}
            </div>
          ))}
        </div>
      );
    case "cronbach":
      return (
        <div>
          <p>Cronbach's Alpha: {results.data.alpha.toFixed(3)}</p>
          <h4>Item-Total Correlations:</h4>
          {Object.entries(results.data.itemTotalCorrelations).map(([variable, correlation]) => (
            <p key={variable}>{variable}: {(correlation as number).toFixed(3)}</p>
          ))}
        </div>
      );
    case "correlation":
      return <p>Correlation: {results.data.correlation}</p>;
    default:
      return null;
  }
}
