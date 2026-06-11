import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock } from 'lucide-react';

export default function Placeholder({ title = "Coming Soon" }: { title?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 text-slate-900 px-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 shadow-sm mb-6">
        <Clock className="h-8 w-8" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight mb-3">{title}</h1>
      <p className="text-slate-500 mb-8 max-w-md text-center">
        This feature is currently under development. Please check back later!
      </p>
      <Link to={-1 as any} onClick={(e) => {
        if (window.history.length > 1) {
          e.preventDefault();
          window.history.back();
        }
      }}>
        <Button variant="outline" className="rounded-full h-11 px-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </Link>
    </div>
  );
}
