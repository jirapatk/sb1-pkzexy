"use client";

import { useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/supabase';
import type { Project, ProjectMetadata } from '@/lib/types';

const bypassAuth = process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true';

const mockData = {
  id: 'mock-1',
  name: 'Sample Project',
  description: 'A sample project for demonstration',
  created_at: new Date().toISOString(),
  owner_id: 'bypass-user',
  data: [],
  variableGroups: [],
  collaborators: [],
  collaboratorCount: 0,
  updatedAt: new Date().toISOString(),
};

export function useSupabase() {
  const supabase = createClientComponentClient<Database>();

  const getProjects = useCallback(async (): Promise<ProjectMetadata[]> => {
    if (bypassAuth) {
      return [
        {
          id: mockData.id,
          name: mockData.name,
          description: mockData.description,
          created_at: mockData.created_at,
          owner_id: mockData.owner_id,
          collaboratorCount: 0,
          updatedAt: mockData.updatedAt,
        }
      ];
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        throw new Error('Authentication required');
      }

      const { data, error } = await supabase
        .from('projects')
        .select(`
          id,
          name,
          description,
          created_at,
          owner_id,
          collaborators(count)
        `)
        .eq('owner_id', session.user.id);

      if (error) {
        throw new Error(error.message);
      }

      return data?.map(project => ({
        ...project,
        collaboratorCount: project.collaborators?.[0]?.count || 0,
        updatedAt: project.created_at,
      })) || [];
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to load projects: ${error.message}`);
      }
      throw new Error('Failed to load projects');
    }
  }, [supabase]);

  const getProject = useCallback(async (id: string): Promise<Project> => {
    if (bypassAuth) {
      // Return mock data with the requested ID
      return {
        ...mockData,
        id,
        data: [],
        variableGroups: [],
        collaborators: [],
      };
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        throw new Error('Authentication required');
      }

      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          variable_groups(*),
          collaborators(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('Project not found');
      }

      return {
        ...data,
        variableGroups: data.variable_groups || [],
        collaborators: data.collaborators || [],
        collaboratorCount: data.collaborators?.length || 0,
        updatedAt: data.created_at,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to load project: ${error.message}`);
      }
      throw new Error('Failed to load project');
    }
  }, [supabase]);

  const updateProject = useCallback(async (projectId: string, updateData: { data?: any }) => {
    const { error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', projectId);

    if (error) throw error;
  }, [supabase]);

  const createProject = useCallback(async (project: {
    name: string;
    description: string;
    data?: any[];
  }): Promise<ProjectMetadata> => {
    if (bypassAuth) {
      const id = `mock-${Date.now()}`;
      return {
        id,
        name: project.name,
        description: project.description,
        created_at: new Date().toISOString(),
        owner_id: 'bypass-user',
        collaboratorCount: 0,
        updatedAt: new Date().toISOString(),
      };
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        throw new Error('Authentication required');
      }

      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: project.name,
          description: project.description,
          data: project.data || [],
          owner_id: session.user.id,
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('Failed to create project');
      }

      return {
        ...data,
        collaboratorCount: 0,
        updatedAt: data.created_at,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to create project: ${error.message}`);
      }
      throw new Error('Failed to create project');
    }
  }, [supabase]);

  const subscribeToProject = useCallback((
    projectId: string,
    callback: (payload: any) => void
  ) => {
    if (bypassAuth) return () => {};

    try {
      const subscription = supabase
        .channel(`project:${projectId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'projects',
            filter: `id=eq.${projectId}`,
          },
          callback
        )
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to subscribe to project: ${error.message}`);
      }
      throw new Error('Failed to subscribe to project');
    }
  }, [supabase]);

  return {
    getProjects,
    getProject,
    updateProject,
    createProject,
    subscribeToProject,
  };
}
