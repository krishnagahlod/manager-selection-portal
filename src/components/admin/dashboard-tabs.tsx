'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardTable } from '@/components/admin/dashboard-table';
import { ReflectionsTab } from '@/components/admin/reflections-tab';
import { type DashboardRow } from '@/types/database';
import { Users, BookOpen } from 'lucide-react';

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

interface Props {
  rows: DashboardRow[];
  reflections: Reflection[];
}

export function DashboardTabs({ rows, reflections }: Props) {
  return (
    <Tabs defaultValue="candidates">
      <TabsList className="mb-4">
        <TabsTrigger value="candidates" className="gap-1.5">
          <Users className="w-3.5 h-3.5" />Candidates
        </TabsTrigger>
        <TabsTrigger value="reflections" className="gap-1.5">
          <BookOpen className="w-3.5 h-3.5" />Reflections ({reflections.length})
        </TabsTrigger>
      </TabsList>
      <TabsContent value="candidates">
        <DashboardTable rows={rows} />
      </TabsContent>
      <TabsContent value="reflections">
        <ReflectionsTab reflections={reflections} />
      </TabsContent>
    </Tabs>
  );
}
