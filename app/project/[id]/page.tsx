import { Suspense } from 'react';
import ProjectDetail from '@/components/project/project-detail';

export default async function ProjectPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading project...</p>
      </div>
    }>
      <ProjectDetail id={params.id} />
    </Suspense>
  );
}