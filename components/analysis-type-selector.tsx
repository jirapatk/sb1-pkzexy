"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AnalysisTypeSelectorProps {
  onValueChange: (value: string) => void;
}

export function AnalysisTypeSelector({ onValueChange }: AnalysisTypeSelectorProps) {
  return (
    <div>
      <label className="text-sm font-medium">Analysis Type</label>
      <Select onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select analysis type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="descriptive">Descriptive Statistics</SelectItem>
          <SelectItem value="cronbach">Cronbach's Alpha</SelectItem>
          <SelectItem value="correlation">Correlation Analysis</SelectItem>
          <SelectItem value="factor">Factor Analysis</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
