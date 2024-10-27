"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DataTableProps {
  data: any[];
}

export default function DataTable({ data }: DataTableProps) {
  if (!data.length) {
    return (
      <div className="flex h-[400px] items-center justify-center text-muted-foreground">
        No data available. Import data to begin analysis.
      </div>
    );
  }

  const columns = Object.keys(data[0]).filter(col => !col.endsWith('_fulltext'));

  return (
    <div className="h-[600px] w-full rounded-md border overflow-hidden">
      <ScrollArea className="h-full">
        <ScrollArea className="w-max">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column} className="px-4 py-2 whitespace-nowrap">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>{column}</TooltipTrigger>
                        <TooltipContent>
                          {data[0][`${column}_fulltext`] || column}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, i) => (
                <TableRow key={i}>
                  {columns.map((column) => (
                    <TableCell key={column} className="px-4 py-2 whitespace-nowrap">{row[column]}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </ScrollArea>
    </div>
  );
}
