"use client";

import { useState, useEffect } from "react";
import { Upload, FileSpreadsheet, AlertCircle, Check, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSupabase } from "@/hooks/use-supabase";
interface DataImportProps {
  onDataImport: (data: any[], groups: QuestionGroup[]) => void;
  projectId: string | null;
}

interface Mapping {
  text: string;
  value: string;
}

interface QuestionGroup {
  id: string;
  name: string;
  englishName: string;
  questions: { id: string; text: string }[];
}

export default function DataImport({ onDataImport, projectId }: DataImportProps) {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [showMappingDialog, setShowMappingDialog] = useState(false);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawData, setRawData] = useState<any[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [mappings, setMappings] = useState<Mapping[]>([
    { text: "ไม่เห็นด้วยอย่างยิ่ง", value: "1" },
    { text: "ไม่เห็นด้วย", value: "2" },
    { text: "ค่อนข้างไม่เห็นด้วย", value: "3" },
    { text: "ค่อนข้างเห็นด้วย", value: "4" },
    { text: "เห็นด้วย", value: "5" },
    { text: "เห็นด้วยอย่างยิ่ง", value: "6" }
  ]);
  const [questionGroups, setQuestionGroups] = useState<QuestionGroup[]>([]);
  const { updateProject } = useSupabase();
  const [selectedRows, setSelectedRows] = useState<number[]>([]);


  const detectQuestionGroups = (headers: string[]) => {
    const groups: Record<string, { name: string, englishName: string, questions: { id: string; text: string }[] }> = {};
    const questionColumns: string[] = [];

    headers.forEach(header => {
      const match = header.match(/^([^(]+)\s*\(([^)]+)\)\s*\[/);
      if (match) {
        const thaiName = match[1].trim();
        const englishName = match[2].trim();
        const groupKey = englishName.toUpperCase().slice(0, 3);

        if (!groups[groupKey]) {
          groups[groupKey] = {
            name: thaiName,
            englishName: englishName,
            questions: []
          };
        }
        const questionNumber = header.match(/\[(\d+)\./)?.[1] || "";
        groups[groupKey].questions.push({ id: `${groupKey}${questionNumber}`, text: header });
        questionColumns.push(header);
      }
    });

    const groupsArray = Object.entries(groups).map(([id, group]) => ({
      id,
      ...group,
      questions: group.questions.sort((a, b) => {
        const numA = parseInt(a.id.slice(3));
        const numB = parseInt(b.id.slice(3));
        return numA - numB;
      })
    }));

    setQuestionGroups(groupsArray);
    setSelectedColumns(questionColumns); // Auto-select question columns
  };

  const processCSV = (text: string) => {
    const rows = text.split("\n").filter(row => row.trim());
    const headers = rows[0].split(",").map(header => header.trim());

    const data = rows.slice(1).map((row, index) => {
      const values = row.split(",");
      const rowData = headers.reduce((obj: any, header, i) => {
        obj[header] = values[i]?.trim() || "";
        return obj;
      }, {});

      // Count blank values
      const blankCount = Object.values(rowData).filter(value => value === "").length;

      // If there are 5 or fewer blank values, select the row
      if (blankCount <= 5) {
        setSelectedRows(prev => [...prev, index]);
      }

      return rowData;
    });

    setHeaders(headers);
    setRawData(data);
    detectQuestionGroups(headers);
    setShowMappingDialog(true);
  };

  const handleFileDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type === "text/csv") {
      const text = await file.text();
      processCSV(text);
    } else {
      toast({
        title: "Error importing data",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "text/csv") {
      const text = await file.text();
      processCSV(text);
    }
  };

  const toggleColumnSelection = (header: string) => {
    setSelectedColumns(prev =>
      prev.includes(header)
        ? prev.filter(h => h !== header)
        : [...prev, header]
    );
  };

  const toggleAllColumns = () => {
    setSelectedColumns(prev =>
      prev.length === headers.length ? [] : [...headers]
    );
  };

  const addMapping = () => {
    setMappings([...mappings, { text: "", value: "" }]);
  };

  const removeMapping = (index: number) => {
    setMappings(mappings.filter((_, i) => i !== index));
  };

  const updateMapping = (index: number, field: "text" | "value", value: string) => {
    const newMappings = [...mappings];
    newMappings[index][field] = value;
    setMappings(newMappings);
  };

  const applyMappings = () => {
    const mappingDict = mappings.reduce((acc, { text, value }) => {
      if (text && value) acc[text] = value;
      return acc;
    }, {} as Record<string, string>);

    const processedData = rawData
      .filter((_, index) => selectedRows.includes(index))
      .map(row => {
        const newRow = { ...row };
        selectedColumns.forEach(column => {
          if (row[column]) {
            newRow[column] = mappingDict[row[column]] || row[column];
          }
        });
        return newRow;
      });

    const renamedData = processedData.map(row => {
      const newRow: Record<string, any> = {};
      Object.entries(row).forEach(([key, value]) => {
        const group = questionGroups.find(g => g.questions.some(q => q.text === key));
        if (group) {
          const question = group.questions.find(q => q.text === key);
          if (question) {
            newRow[question.id] = value;
            newRow[`${question.id}_fulltext`] = key; // Store the full question text
          }
        } else {
          newRow[key] = value;
        }
      });
      return newRow;
    });

    onDataImport(renamedData, questionGroups);
    if (projectId) {
      updateProject(projectId, {
        data: renamedData,
      });
    }
    setShowMappingDialog(false);
    toast({
      title: "Success",
      description: `Imported ${processedData.length} rows of data with ${questionGroups.length} question groups`,
    });
  };

  // Add this new function to toggle row selection
  const toggleRowSelection = (index: number) => {
    setSelectedRows(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  return (
    <ScrollArea className="h-[calc(100vh-12rem)]">
      <div className="space-y-6 p-6">
        <div
          className={`relative rounded-lg border-2 border-dashed p-12 transition-colors ${isDragging ? "border-primary bg-primary/5" : "border-muted"
            }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleFileDrop}
        >
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="rounded-full bg-primary/10 p-4">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Drag and drop your data file</h3>
              <p className="text-sm text-muted-foreground">
                or click to browse for a CSV file
              </p>
            </div>
            <label>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileSelect}
              />
              <Button variant="outline" >Browse Files</Button>
            </label>
          </div>
        </div>
      </div>

      <Dialog open={showMappingDialog} onOpenChange={setShowMappingDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Configure Data Import</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="mappings" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="mappings">Value Mappings</TabsTrigger>
              <TabsTrigger value="groups">Question Groups</TabsTrigger>
              <TabsTrigger value="columns">Column Selection</TabsTrigger>
              <TabsTrigger value="rows">Row Selection</TabsTrigger>
            </TabsList>
            <ScrollArea className="h-[60vh] mt-4">
              <TabsContent value="mappings" className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Text Value</TableHead>
                      <TableHead>Numeric Value</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mappings.map((mapping, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Input
                            value={mapping.text}
                            onChange={(e) => updateMapping(index, "text", e.target.value)}
                            placeholder="Enter text value"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={mapping.value}
                            onChange={(e) => updateMapping(index, "value", e.target.value)}
                            placeholder="Enter numeric value"
                            type="number"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeMapping(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Button variant="outline" onClick={addMapping}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Mapping
                </Button>
              </TabsContent>

              <TabsContent value="groups" className="space-y-4">
                {questionGroups.map((group) => (
                  <div key={group.id} className="space-y-2">
                    <h5 className="font-medium">
                      {group.name} ({group.englishName}) - {group.id}
                    </h5>
                    <div className="pl-4 text-sm text-muted-foreground">
                      {group.questions.map((q, i) => (
                        <div key={i}>
                          {group.id}{i + 1}: {q.text}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="columns" className="space-y-4">
                <div className="flex items-center space-x-2 py-2">
                  <Checkbox
                    id="select-all"
                    checked={selectedColumns.length === headers.length}
                    onCheckedChange={toggleAllColumns}
                  />
                  <label htmlFor="select-all" className="text-sm font-medium">
                    Select All Columns
                  </label>
                </div>
                <div className="space-y-2">
                  {headers.map((header) => (
                    <div key={header} className="flex items-center space-x-2">
                      <Checkbox
                        id={header}
                        checked={selectedColumns.includes(header)}
                        onCheckedChange={() => toggleColumnSelection(header)}
                      />
                      <Label htmlFor={header} className="text-sm">
                        {header}
                      </Label>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="rows" className="space-y-4">
                <div className="space-y-2">
                  {rawData.map((row, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Checkbox
                        id={`row-${index}`}
                        checked={selectedRows.includes(index)}
                        onCheckedChange={() => toggleRowSelection(index)}
                      />
                      <Label htmlFor={`row-${index}`} className="text-sm">
                        Row {index + 1} ({Object.values(row).filter(v => v !== "").length} non-empty values)
                      </Label>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>

          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setShowMappingDialog(false)}>
              Cancel
            </Button>
            <Button onClick={applyMappings}>
              <Check className="mr-2 h-4 w-4" />
              Import Data
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </ScrollArea>
  );
}
