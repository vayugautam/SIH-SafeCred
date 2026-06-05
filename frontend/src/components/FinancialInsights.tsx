import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb } from 'lucide-react';

interface InsightProps {
  coaching_tips?: string[];
  lender_notes?: string[];
  risk_band?: string;
  composite_score?: number;
  final_sci?: number;
}

export function FinancialInsights({ coaching_tips, lender_notes, risk_band, composite_score, final_sci }: InsightProps) {
  if (!coaching_tips && !lender_notes) {
    return null;
  }

  const riskLabel = risk_band?.replaceAll('_', ' ');

  return (
    <div className="space-y-4">
      {coaching_tips && coaching_tips.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/60">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Personalized coaching tips</CardTitle>
            </div>
            <CardDescription>
              A short list of next steps to improve the applicant profile.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {coaching_tips.map((tip, index) => (
                <li key={index} className="flex gap-3 rounded-lg bg-white p-3 ring-1 ring-blue-100">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                    {index + 1}
                  </span>
                  <p className="text-sm text-slate-700">{tip}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {lender_notes && lender_notes.length > 0 && (
        <Card className="border-slate-200">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-lg">Lender notes</CardTitle>
              {riskLabel && (
                <Badge variant="outline" className="capitalize">
                  {riskLabel}
                </Badge>
              )}
            </div>
            <CardDescription>
              A simple summary of the main signals behind the application.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {lender_notes.map((note, index) => (
                <li key={index} className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-slate-400" />
                  <p className="text-sm text-slate-700">{note}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {(composite_score || final_sci) && (
        <Card className="border-slate-200">
          <CardContent className="pt-6">
            <div className="grid gap-6 sm:grid-cols-2">
              {composite_score && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Composite Score</p>
                  <p className="text-3xl font-bold text-slate-900">{composite_score.toFixed(1)}</p>
                </div>
              )}
              {final_sci && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">SafeCred Index</p>
                  <p className={\`text-3xl font-bold \${
                    final_sci >= 70 ? 'text-green-600' :
                    final_sci >= 50 ? 'text-yellow-600' :
                    'text-red-600'
                  }\`}>
                    {final_sci.toFixed(0)}/100
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
