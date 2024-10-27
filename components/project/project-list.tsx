"use client";

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2, Users } from "lucide-react";
import type { ProjectMetadata } from "@/lib/types";

interface ProjectListProps {
  projects: ProjectMetadata[];
  onProjectSelect: (projectId: string) => void;
  onProjectShare: (projectId: string) => void;
}

export function ProjectList({ projects, onProjectSelect, onProjectShare }: ProjectListProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {projects.map((project) => (
        <Card 
          key={project.id} 
          className="cursor-pointer transition-colors hover:bg-accent/50"
          onClick={() => onProjectSelect(project.id)}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{project.name}</CardTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={(e) => {
                  e.stopPropagation(); // Prevent project selection when clicking share
                  onProjectShare(project.id);
                }}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>{project.description}</CardDescription>
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <span>Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{project.collaboratorCount}</span>
              </div>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}