import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const FinancialReports = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Reports</CardTitle>
        <CardDescription>Generate reports and track revenue</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button className="w-full justify-start" size="lg">
          Daily Revenue Report
        </Button>
        <Button variant="outline" className="w-full justify-start" size="lg">
          Outstanding Bills Report
        </Button>
        <Button variant="outline" className="w-full justify-start" size="lg">
          Monthly Financial Summary
        </Button>
      </CardContent>
    </Card>
  );
};