import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          created_at: string;
          name: string;
          description: string;
          owner_id: string;
          data: Json;
        };
        Insert: {
          id?: string;
          created_at?: string;
          name: string;
          description: string;
          owner_id: string;
          data?: Json;
        };
        Update: {
          id?: string;
          created_at?: string;
          name?: string;
          description?: string;
          owner_id?: string;
          data?: Json;
        };
      };
      variable_groups: {
        Row: {
          id: string;
          created_at: string;
          name: string;
          variables: string[];
          project_id: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          name: string;
          variables: string[];
          project_id: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          name?: string;
          variables?: string[];
          project_id?: string;
        };
      };
      collaborators: {
        Row: {
          id: string;
          created_at: string;
          project_id: string;
          user_id: string;
          role: 'viewer' | 'editor' | 'admin';
        };
        Insert: {
          id?: string;
          created_at?: string;
          project_id: string;
          user_id: string;
          role?: 'viewer' | 'editor' | 'admin';
        };
        Update: {
          id?: string;
          created_at?: string;
          project_id?: string;
          user_id?: string;
          role?: 'viewer' | 'editor' | 'admin';
        };
      };
    };
  };
}