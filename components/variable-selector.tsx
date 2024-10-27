"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";

interface VariableSelectorProps {
  variables: string[];
  selectedVariables: string[];
  onVariableToggle: (variable: string) => void;
}

export function VariableSelector({
  variables,
  selectedVariables,
  onVariableToggle,
}: VariableSelectorProps) {
  return (
    <div>
      <label className="text-sm font-medium">Variables</label>
      <ScrollArea className="h-[200px] w-full rounded-md border p-4">
        {variables.map((variable) => (
          <div key={variable} className="flex items-center space-x-2 py-2">
            <Checkbox
              id={variable}
              checked={selectedVariables.includes(variable)}
              onCheckedChange={() => onVariableToggle(variable)}
            />
            <label htmlFor={variable} className="text-sm">
              {variable}
            </label>
          </div>
        ))}
      </ScrollArea>
    </div>
  );
}