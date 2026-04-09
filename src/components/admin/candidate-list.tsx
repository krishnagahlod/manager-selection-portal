'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VerticalBadge } from '@/components/shared/vertical-badge';
import { GitCompareArrows, X } from 'lucide-react';
import Link from 'next/link';
import { type Vertical } from '@/types/database';

interface CandidateItem {
  id: string;
  full_name: string;
  email: string;
  verticals: Vertical[];
  attPct: number;
  subCount: number;
}

export function CandidateList({ candidates }: { candidates: CandidateItem[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const router = useRouter();

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 4) next.add(id);
      return next;
    });
  };

  const handleCompare = () => {
    const ids = Array.from(selected).join(',');
    router.push(`/a/candidates/compare?ids=${ids}`);
  };

  return (
    <div>
      <div className="space-y-2">
        {candidates.map((candidate) => {
          const isSelected = selected.has(candidate.id);
          return (
            <Card
              key={candidate.id}
              className={`transition-all duration-150 ${isSelected ? 'ring-2 ring-primary border-primary/30' : 'border-border/60 hover:shadow-card-hover'}`}
            >
              <CardContent className="flex items-center gap-3 p-4">
                {/* Checkbox */}
                <button
                  onClick={() => toggleSelect(candidate.id)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                    isSelected ? 'bg-primary border-primary text-white' : 'border-muted-foreground/30 hover:border-primary/50'
                  }`}
                >
                  {isSelected && (
                    <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none"><path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  )}
                </button>

                {/* Candidate info */}
                <Link href={`/a/candidates/${candidate.id}`} className="flex-1 min-w-0 group">
                  <p className="font-medium group-hover:text-primary transition-colors">
                    {candidate.full_name || candidate.email}
                  </p>
                  <p className="text-xs text-muted-foreground">{candidate.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {candidate.verticals.map((v) => <VerticalBadge key={v} vertical={v} />)}
                  </div>
                </Link>

                {/* Quick stats */}
                <div className="flex items-center gap-3 shrink-0 text-xs">
                  <div className="text-center">
                    <p className="font-semibold text-sm">{candidate.attPct}%</p>
                    <p className="text-muted-foreground">Attendance</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-sm">{candidate.subCount}</p>
                    <p className="text-muted-foreground">Submissions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Floating compare bar */}
      {selected.size >= 2 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-3 bg-card border shadow-lg rounded-2xl px-5 py-3">
            <span className="text-sm font-medium">{selected.size} selected</span>
            <Button onClick={handleCompare} className="gap-2">
              <GitCompareArrows className="w-4 h-4" />
              Compare
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelected(new Set())}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
