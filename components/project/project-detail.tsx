"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShareDialog } from "@/components/project/share-dialog";
import DataTable from "@/components/DataTable";
import Analysis from "@/components/Analysis";
import Visualization from "@/components/Visualization";
import { useSupabase } from "@/hooks/use-supabase";
import { useToast } from "@/hooks/use-toast";
import type { Project } from "@/lib/types";

interface ProjectDetailProps {
  id: string;
}

export default function ProjectDetail({ id }: ProjectDetailProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { getProject, updateProject, subscribeToProject } = useSupabase();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProject = async () => {
      try {
        const projectData = await getProject(id);
        setProject(projectData);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load project';
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [id, getProject, toast]);

  useEffect(() => {
    const unsubscribe = subscribeToProject(id, (payload: any) => {
      if (payload.eventType === "UPDATE") {
        setProject((prev) => ({
          ...prev!,
          ...payload.new,
        }));
      }
    });

    return () => {
      unsubscribe?.();
    };
  }, [id, subscribeToProject]);

  const handleShare = async (email: string) => {
    try {
      await updateProject(id, {
        data: {
          collaborators: [...(project?.collaborators || []), { email, role: 'viewer' }]
        }
      });
      toast({
        title: "Success",
        description: "Invitation sent successfully",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to share project';
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading project...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Project not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <p className="text-sm text-muted-foreground">{project.description}</p>
            </div>
            <div className="flex items-center space-x-4">
              <ShareDialog projectId={project.id} onInvite={handleShare} />
              <Button variant="outline" onClick={() => router.push("/")}>
                Back to Projects
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="p-6">
          <Tabs defaultValue="data">
            <TabsList className="mb-4">
              <TabsTrigger value="data">Data</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
              <TabsTrigger value="visualization">Visualization</TabsTrigger>
            </TabsList>
            <TabsContent value="data">
              <DataTable data={project.data || []} />
            </TabsContent>
            <TabsContent value="analysis">
              <Analysis data={project.data || []} />
            </TabsContent>
            <TabsContent value="visualization">
              <Visualization data={project.data || []} />
            </TabsContent>
          </Tabs>
        </Card>
      </main>
    </div>
  );
}
