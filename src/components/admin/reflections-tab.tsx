'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, X, BookOpen } from 'lucide-react';

interface Reflection {
  id: string;
  candidate_name: string;
  candidate_email: string;
  session_title: string;
  key_insight: string;
  key_learning: string;
  question: string;
  submitted_at: string;
}

export function ReflectionsTab({ reflections }: { reflections: Reflection[] }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query) return reflections;
    const q = query.toLowerCase();
    return reflections.filter(
      (r) =>
        r.candidate_name.toLowerCase().includes(q) ||
        r.candidate_email.toLowerCase().includes(q) ||
        r.session_title.toLowerCase().includes(q)
    );
  }, [reflections, query]);

  return (
    <Card className="shadow-card border-border/60">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-lg">All Reflections ({reflections.length})</CardTitle>
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or session..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <div className="py-8 text-center">
            <BookOpen className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {reflections.length === 0 ? 'No reflections submitted yet.' : 'No reflections match your search.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => (
              <div key={r.id} className="p-4 rounded-xl border border-border/60 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="font-medium text-sm">{r.candidate_name}</span>
                    <span className="text-xs text-muted-foreground ml-2">{r.candidate_email}</span>
                  </div>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{r.session_title}</span>
                </div>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Insight</p>
                    <p className="mt-0.5">{r.key_insight}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Learning</p>
                    <p className="mt-0.5">{r.key_learning}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Question</p>
                    <p className="mt-0.5">{r.question}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
