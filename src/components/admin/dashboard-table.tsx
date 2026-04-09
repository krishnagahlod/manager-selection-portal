'use client';

import { useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { VerticalBadge } from '@/components/shared/vertical-badge';
import { VERTICAL_LABELS, VERTICALS } from '@/lib/constants';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, X } from 'lucide-react';
import Link from 'next/link';
import { type DashboardRow, type Vertical } from '@/types/database';

type SortKey = 'name' | 'attPct' | 'subCount' | 'logCount' | 'intScore';
type SortDir = 'asc' | 'desc';

export function DashboardTable({ rows }: { rows: DashboardRow[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialQuery = searchParams.get('q') || '';
  const initialVertical = searchParams.get('v') || '';
  const initialSort = (searchParams.get('sort') as SortKey) || 'attPct';
  const initialDir = (searchParams.get('dir') as SortDir) || 'desc';

  const [query, setQuery] = useState(initialQuery);
  const [verticalFilter, setVerticalFilter] = useState(initialVertical);
  const [sortKey, setSortKey] = useState<SortKey>(initialSort);
  const [sortDir, setSortDir] = useState<SortDir>(initialDir);

  const updateURL = (q: string, v: string, sort: SortKey, dir: SortDir) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (v) params.set('v', v);
    if (sort !== 'attPct' || dir !== 'desc') {
      params.set('sort', sort);
      params.set('dir', dir);
    }
    const qs = params.toString();
    router.replace(`/a/dashboard${qs ? `?${qs}` : ''}`, { scroll: false });
  };

  const handleSearch = (value: string) => {
    setQuery(value);
    updateURL(value, verticalFilter, sortKey, sortDir);
  };

  const handleVerticalFilter = (v: string) => {
    const next = verticalFilter === v ? '' : v;
    setVerticalFilter(next);
    updateURL(query, next, sortKey, sortDir);
  };

  const handleSort = (key: SortKey) => {
    const nextDir = sortKey === key && sortDir === 'desc' ? 'asc' : 'desc';
    setSortKey(key);
    setSortDir(nextDir);
    updateURL(query, verticalFilter, key, nextDir);
  };

  const filteredRows = useMemo(() => {
    let result = [...rows];

    // Search
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(
        (r) => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)
      );
    }

    // Vertical filter
    if (verticalFilter) {
      result = result.filter((r) => r.verticals.includes(verticalFilter as Vertical));
    }

    // Sort
    result.sort((a, b) => {
      let av: number | string = 0;
      let bv: number | string = 0;

      switch (sortKey) {
        case 'name': av = a.name.toLowerCase(); bv = b.name.toLowerCase(); break;
        case 'attPct': av = a.attPct; bv = b.attPct; break;
        case 'subCount': av = a.subCount; bv = b.subCount; break;
        case 'logCount': av = a.logCount; bv = b.logCount; break;
        case 'intScore': av = a.intScore ?? -1; bv = b.intScore ?? -1; break;
      }

      if (typeof av === 'string') {
        return sortDir === 'asc' ? av.localeCompare(bv as string) : (bv as string).localeCompare(av);
      }
      return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });

    return result;
  }, [rows, query, verticalFilter, sortKey, sortDir]);

  const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
    <th
      className="pb-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground text-center cursor-pointer hover:text-foreground transition-colors select-none"
      onClick={() => handleSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortKey === field ? (
          sortDir === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />
        ) : (
          <ArrowUpDown className="w-3 h-3 opacity-40" />
        )}
      </span>
    </th>
  );

  return (
    <Card className="shadow-card border-border/60">
      <CardHeader className="pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
          <CardTitle className="text-lg">All Candidates</CardTitle>
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 h-9 w-full md:w-56 text-sm"
            />
            {query && (
              <button onClick={() => handleSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Vertical filter buttons */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="text-xs text-muted-foreground font-medium">Filter:</span>
          {VERTICALS.map((v) => (
            <Button
              key={v}
              variant={verticalFilter === v ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs px-2.5"
              onClick={() => handleVerticalFilter(v)}
            >
              {VERTICAL_LABELS[v]}
            </Button>
          ))}
          {verticalFilter && (
            <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={() => handleVerticalFilter('')}>
              <X className="w-3 h-3 mr-1" />Clear
            </Button>
          )}
          <span className="text-xs text-muted-foreground ml-auto w-full sm:w-auto">
            {filteredRows.length} of {rows.length} candidates
          </span>
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th
                  className="pb-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none"
                  onClick={() => handleSort('name')}
                >
                  <span className="inline-flex items-center gap-1">
                    Name
                    {sortKey === 'name' ? (
                      sortDir === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-40" />
                    )}
                  </span>
                </th>
                <th className="pb-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Verticals</th>
                <SortHeader label="Attendance" field="attPct" />
                <SortHeader label="Submissions" field="subCount" />
                <SortHeader label="Reflections" field="logCount" />
                <th className="pb-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground text-center">Interview</th>
                <SortHeader label="Score" field="intScore" />
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    No candidates match your filters.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr key={row.id} className="border-b last:border-0 hover:bg-accent/40 transition-colors">
                    <td className="py-3.5 pr-3">
                      <Link href={`/a/candidates/${row.id}`} className="group">
                        <p className="font-medium group-hover:text-primary transition-colors">{row.name}</p>
                        <p className="text-xs text-muted-foreground">{row.email}</p>
                      </Link>
                    </td>
                    <td className="py-3.5 pr-3">
                      <div className="flex gap-1 flex-wrap">
                        {row.verticals.map((v) => (
                          <VerticalBadge key={v} vertical={v} />
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 text-center">
                      <Badge className={
                        row.attPct >= 75 ? 'bg-emerald-100 text-emerald-700' :
                        row.attPct >= 50 ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }>
                        {row.attPct}%
                      </Badge>
                    </td>
                    <td className="py-3.5 text-center font-medium">{row.subCount}</td>
                    <td className="py-3.5 text-center font-medium">{row.logCount}</td>
                    <td className="py-3.5 text-center">
                      <Badge variant={row.intStatus === 'completed' ? 'default' : 'outline'} className="text-xs">
                        {row.intStatus.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="py-3.5 text-center font-semibold">
                      {row.intScore !== null ? `${row.intScore}/10` : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
