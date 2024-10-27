import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FactorAnalysisProps {
  data: {
    kmo: {
      overall: number;
      individual: Record<string, number>;
    };
    bartlett: {
      chiSquare: number;
      degreesOfFreedom: number;
      significance: number;
    };
    communalities: {
      variable: string;
      initial: number;
      extraction: number;
    }[];
    totalVariance: {
      component: number;
      initialEigenvalues: {
        total: number;
        percentOfVariance: number;
        cumulative: number;
      };
      extractionSums: {
        total: number;
        percentOfVariance: number;
        cumulative: number;
      };
      rotationSums?: {
        total: number;
        percentOfVariance: number;
        cumulative: number;
      };
    }[];
    componentMatrix: Record<string, Record<string, number>>;
    rotatedComponentMatrix?: Record<string, Record<string, number>>;
    correlationMatrix: Record<string, Record<string, number>>;
  };
}

export function FactorAnalysis({ data }: FactorAnalysisProps) {
  return (
    <Tabs defaultValue="kmo" className="space-y-4">
      <TabsList>
        <TabsTrigger value="kmo">KMO and Bartlett's</TabsTrigger>
        <TabsTrigger value="correlation">Correlation Matrix</TabsTrigger>
        <TabsTrigger value="communalities">Communalities</TabsTrigger>
        <TabsTrigger value="variance">Total Variance</TabsTrigger>
        <TabsTrigger value="component">Component Matrix</TabsTrigger>
        {data.rotatedComponentMatrix && (
          <TabsTrigger value="rotated">Rotated Component Matrix</TabsTrigger>
        )}
      </TabsList>

      {/* KMO and Bartlett's Test */}
      <TabsContent value="kmo">
        <Card>
          <CardHeader>
            <CardTitle>KMO and Bartlett's Test</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell>Kaiser-Meyer-Olkin Measure of Sampling Adequacy</TableCell>
                  <TableCell>{data.kmo.overall.toFixed(3)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Bartlett's Test of Sphericity - Approx. Chi-Square</TableCell>
                  <TableCell>{data.bartlett.chiSquare.toFixed(3)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>df</TableCell>
                  <TableCell>{data.bartlett.degreesOfFreedom}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Sig.</TableCell>
                  <TableCell>{data.bartlett.significance.toFixed(3)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Other tabs content... */}
      {/* Add the remaining tabs implementation */}
    </Tabs>
  );
}
