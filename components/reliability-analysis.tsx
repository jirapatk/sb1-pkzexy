import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ReliabilityAnalysisProps {
  data: {
    caseProcessingSummary: {
      validN: number;
      excluded: number;
      total: number;
    };
    reliabilityStats: {
      cronbachAlpha: number;
      standardizedAlpha: number;
      nItems: number;
    };
    itemStats: {
      variable: string;
      mean: number;
      stdDev: number;
      n: number;
    }[];
    interItemCorrelations: Record<string, Record<string, number>>;
    itemTotalStats: {
      variable: string;
      scaleAvgIfDeleted: number;
      scaleVarianceIfDeleted: number;
      itemTotalCorrelation: number;
      squaredMultipleCorrelation: number;
      alphaIfDeleted: number;
    }[];
    scaleStats: {
      mean: number;
      variance: number;
      stdDev: number;
      nItems: number;
    };
  };
}

export function ReliabilityAnalysis({ data }: ReliabilityAnalysisProps) {
  return (
    <Tabs defaultValue="case-processing" className="space-y-4">
      <TabsList>
        <TabsTrigger value="case-processing">Case Processing</TabsTrigger>
        <TabsTrigger value="reliability-stats">Reliability Statistics</TabsTrigger>
        <TabsTrigger value="item-stats">Item Statistics</TabsTrigger>
        <TabsTrigger value="inter-item">Inter-Item Correlations</TabsTrigger>
        <TabsTrigger value="item-total">Item-Total Statistics</TabsTrigger>
        <TabsTrigger value="scale-stats">Scale Statistics</TabsTrigger>
      </TabsList>

      <TabsContent value="case-processing">
        <Card>
          <CardHeader>
            <CardTitle>Case Processing Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cases</TableHead>
                  <TableHead>N</TableHead>
                  <TableHead>%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Valid</TableCell>
                  <TableCell>{data.caseProcessingSummary.validN}</TableCell>
                  <TableCell>{((data.caseProcessingSummary.validN / data.caseProcessingSummary.total) * 100).toFixed(1)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Excluded</TableCell>
                  <TableCell>{data.caseProcessingSummary.excluded}</TableCell>
                  <TableCell>{((data.caseProcessingSummary.excluded / data.caseProcessingSummary.total) * 100).toFixed(1)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Total</TableCell>
                  <TableCell>{data.caseProcessingSummary.total}</TableCell>
                  <TableCell>100.0</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="reliability-stats">
        <Card>
          <CardHeader>
            <CardTitle>Reliability Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cronbach's Alpha</TableHead>
                  <TableHead>Cronbach's Alpha Based on Standardized Items</TableHead>
                  <TableHead>N of Items</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>{data.reliabilityStats.cronbachAlpha.toFixed(3)}</TableCell>
                  <TableCell>{data.reliabilityStats.standardizedAlpha.toFixed(3)}</TableCell>
                  <TableCell>{data.reliabilityStats.nItems}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="item-stats">
        <Card>
          <CardHeader>
            <CardTitle>Item Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Mean</TableHead>
                  <TableHead>Std. Deviation</TableHead>
                  <TableHead>N</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.itemStats.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.variable}</TableCell>
                    <TableCell>{item.mean.toFixed(3)}</TableCell>
                    <TableCell>{item.stdDev.toFixed(3)}</TableCell>
                    <TableCell>{item.n}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="inter-item">
        <Card>
          <CardHeader>
            <CardTitle>Inter-Item Correlation Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead></TableHead>
                  {Object.keys(data.interItemCorrelations).map((key) => (
                    <TableHead key={key}>{key}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(data.interItemCorrelations).map(([row, correlations]) => (
                  <TableRow key={row}>
                    <TableCell>{row}</TableCell>
                    {Object.entries(correlations).map(([col, value]) => (
                      <TableCell key={col}>{value.toFixed(3)}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="item-total">
        <Card>
          <CardHeader>
            <CardTitle>Item-Total Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Scale Mean if Item Deleted</TableHead>
                  <TableHead>Scale Variance if Item Deleted</TableHead>
                  <TableHead>Corrected Item-Total Correlation</TableHead>
                  <TableHead>Squared Multiple Correlation</TableHead>
                  <TableHead>Cronbach's Alpha if Item Deleted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.itemTotalStats.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.variable}</TableCell>
                    <TableCell>{item.scaleAvgIfDeleted.toFixed(3)}</TableCell>
                    <TableCell>{item.scaleVarianceIfDeleted.toFixed(3)}</TableCell>
                    <TableCell>{item.itemTotalCorrelation.toFixed(3)}</TableCell>
                    <TableCell>{item.squaredMultipleCorrelation.toFixed(3)}</TableCell>
                    <TableCell>{item.alphaIfDeleted.toFixed(3)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="scale-stats">
        <Card>
          <CardHeader>
            <CardTitle>Scale Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mean</TableHead>
                  <TableHead>Variance</TableHead>
                  <TableHead>Std. Deviation</TableHead>
                  <TableHead>N of Items</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>{data.scaleStats.mean.toFixed(3)}</TableCell>
                  <TableCell>{data.scaleStats.variance.toFixed(3)}</TableCell>
                  <TableCell>{data.scaleStats.stdDev.toFixed(3)}</TableCell>
                  <TableCell>{data.scaleStats.nItems}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
