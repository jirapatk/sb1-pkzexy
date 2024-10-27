"use client";

import { useState, useEffect } from "react";
import { Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthDialog } from "@/components/auth/auth-dialog";
import { ProjectDialog } from "@/components/project/project-dialog";
import { ProjectList } from "@/components/project/project-list";
import DataImport from "@/components/DataImport";
import { useAuth } from "@/lib/auth";
import { useSupabase } from "@/hooks/use-supabase";
import { useToast } from "@/hooks/use-toast";
import type { ProjectMetadata } from "@/lib/types";

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const { getProjects, createProject } = useSupabase();
  const { toast } = useToast();
  const [projects, setProjects] = useState<ProjectMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  useEffect(() => {
    const loadProjects = async () => {
      if (!authLoading && user) {
        try {
          setLoading(true);
          const projectList = await getProjects();
          setProjects(projectList);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to load projects';
          toast({
            title: "Error",
            description: message,
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      }
    };

    loadProjects();
  }, [user, authLoading, getProjects, toast]);

  const handleProjectCreate = async (project: { name: string; description: string }) => {
    try {
      const newProject = await createProject({
        name: project.name,
        description: project.description,
      });

      setProjects(prev => [...prev, newProject]);
      setSelectedProjectId(newProject.id);
      setShowImport(true);
      toast({
        title: "Success",
        description: "Project created successfully",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create project';
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleProjectSelect = (projectId: string) => {
    window.location.href = `/project/${projectId}`;
  };

  const handleProjectShare = (projectId: string) => {
    toast({
      title: "Share Project",
      description: "Project sharing will be implemented soon",
    });
  };

  const handleDataImport = (data: any[], groups: any[]) => {
    setShowImport(false);
    setSelectedProjectId(null);
    toast({
      title: "Success",
      description: "Data imported successfully",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calculator className="h-6 w-6" />
              <h1 className="text-2xl font-bold">StatFlow</h1>
            </div>
            <div className="flex items-center space-x-4">
              <AuthDialog />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {showImport ? (
          <DataImport onDataImport={handleDataImport} projectId={selectedProjectId} />
        ) : (
          <>
            {authLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : user ? (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Your Projects</h2>
                  <ProjectDialog onProjectCreate={handleProjectCreate} />
                </div>
                {loading ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Loading projects...</p>
                  </div>
                ) : projects.length > 0 ? (
                  <ProjectList
                    projects={projects}
                    onProjectSelect={handleProjectSelect}
                    onProjectShare={handleProjectShare}
                  />
                ) : (
                  <div className="text-center py-12 bg-muted/50 rounded-lg">
                    <h3 className="text-lg font-medium mb-2">No projects yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first project to start analyzing data
                    </p>
                    <ProjectDialog onProjectCreate={handleProjectCreate} />
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center space-y-4">
                <h2 className="text-2xl font-bold">Welcome to StatFlow</h2>
                <p className="text-muted-foreground">
                  Please sign in to access your statistical analysis projects.
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
