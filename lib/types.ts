export interface ProjectMetadata {
  id: string;
  name: string;
  description: string;
  created_at: string;
  owner_id: string;
  collaboratorCount?: number;
  updatedAt?: string;
}

export interface Project extends ProjectMetadata {
  data: any[];
  variableGroups: VariableGroup[];
  collaborators: Collaborator[];
}

export interface VariableGroup {
  id: string;
  name: string;
  englishName: string;
  questions: string[];
}

export interface Collaborator {
  id: string;
  user_id: string;
  role: 'viewer' | 'editor' | 'admin';
  created_at: string;
}