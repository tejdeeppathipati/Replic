"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getSupabaseBrowserClient } from "./supabase-browser";

export interface ProjectSettings {
  brandName: string;
  description: string;
  website: string;
  persona: string;
  keywords: string;
  watchedAccounts: string;
  autoPost: boolean;
  whatsappDrafts: boolean;
  monitorReddit: boolean;
  dailyLimit: number;
}

export interface Project {
  id: string;
  name: string;
  settings: ProjectSettings;
}

interface ProjectsContextType {
  projects: Project[];
  currentProjectId: string;
  currentProject: Project | undefined;
  userId: string | null;
  setCurrentProject: (projectId: string) => void;
  updateProject: (projectId: string, updates: Partial<ProjectSettings>) => void;
  createProject: (name: string) => void;
  refreshProjects: () => Promise<void>;
  isLoading: boolean;
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

const DEFAULT_SETTINGS: ProjectSettings = {
  brandName: "",
  description: "",
  website: "",
  persona: "normal",
  keywords: "",
  watchedAccounts: "",
  autoPost: false,
  whatsappDrafts: true,
  monitorReddit: true,
  dailyLimit: 30,
};

export const ProjectsProvider = ({ children }: { children: React.ReactNode }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = getSupabaseBrowserClient();

  // Function to load projects from database
  const loadProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log("📦 Starting to load projects...");

      // Get current user
      console.log("👤 Fetching current user from Supabase auth...");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log("❌ No user logged in, clearing projects");
        setProjects([]);
        setCurrentProjectId("");
        setUserId(null);
        return;
      }

      console.log("✅ User authenticated:", user.id);
      setUserId(user.id);

      // Fetch brand_agent records from database
      // The RLS policy requires auth.uid() = user_id, so the authenticated session is used automatically
      console.log("🔍 Fetching brand_agent records from database for user:", user.id);

      // Create a promise that times out after 10 seconds to prevent indefinite hanging
      const queryPromise = (async () => {
        return await supabase
          .from("brand_agent")
          .select("*")
          .eq("user_id", user.id);
      })();

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Database query timeout after 10 seconds")), 10000)
      );

      let data: any;
      let error: any;
      try {
        const result = (await Promise.race([queryPromise, timeoutPromise])) as any;
        data = result?.data;
        error = result?.error;
      } catch (timeoutError) {
        console.error("❌ Database query timed out:", timeoutError);
        setProjects([]);
        return;
      }

      if (error) {
        console.error("❌ Failed to load projects from database:", error);
        console.error("   Error details:", {
          message: error.message,
          code: (error as any).code,
          status: (error as any).status,
        });
        return;
      }

      if (!data) {
        console.warn("⚠️  Query returned null data");
        setProjects([]);
        return;
      }

      console.log("📊 Database query returned:", data.length, "records");

      // Transform database records to Project format
      const loadedProjects: Project[] = (data || []).map((agent: any) => ({
        id: agent.id,
        name: agent.name,
        settings: {
          brandName: agent.brand_name || "",
          description: agent.description || "",
          website: agent.website || "",
          persona: agent.personality || "normal",
          keywords: agent.keywords || "",
          watchedAccounts: agent.watched_accounts || "",
          autoPost: agent.auto_post || false,
          whatsappDrafts: agent.whatsapp_drafts || true,
          monitorReddit: agent.monitor_reddit || true,
          dailyLimit: agent.daily_reply_limit || 30,
        },
      }));

      console.log(`✅ Loaded ${loadedProjects.length} projects:`, loadedProjects.map(p => p.name));
      setProjects(loadedProjects);

      // Set first project as current if none selected or if current project doesn't exist
      setCurrentProjectId((prevId) => {
        if (loadedProjects.length > 0) {
          // If current project still exists, keep it
          const currentExists = loadedProjects.some(p => p.id === prevId);
          if (currentExists) {
            console.log("📌 Keeping current project:", prevId);
            return prevId;
          }
          // Otherwise, set first project
          console.log("📌 Setting first project as current:", loadedProjects[0].id);
          return loadedProjects[0].id;
        }
        console.log("⚠️  No projects available");
        return "";
      });
    } catch (error) {
      console.error("❌ Error loading projects:", error);
    } finally {
      setIsLoading(false);
      console.log("✅ Project loading complete");
    }
  }, [supabase]);

  // Load projects on mount and when auth state changes
  useEffect(() => {
    let mounted = true;

    // Initial load with a larger delay to ensure auth is ready
    const initialLoad = async () => {
      console.log("🔄 Waiting for Supabase auth to be initialized...");
      // Longer delay to ensure Supabase auth is fully initialized and session is available
      await new Promise(resolve => setTimeout(resolve, 300));
      if (mounted) {
        console.log("⏱️  Auth initialization delay complete, loading projects...");
        await loadProjects();
      }
    };

    initialLoad();

    // Listen to auth state changes and reload projects when user logs in
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: any) => {
        if (!mounted) return;

        console.log("Auth state changed in ProjectsProvider:", event, session?.user?.id);
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.access_token) {
          // Reload projects when user signs in or token is refreshed
          console.log("User signed in or token refreshed, reloading projects...");
          // Wait a moment to ensure the session is fully set before querying
          await new Promise(resolve => setTimeout(resolve, 100));
          await loadProjects();
        } else if (event === 'SIGNED_OUT') {
          // Clear projects when user signs out
          console.log("User signed out, clearing projects");
          setProjects([]);
          setCurrentProjectId("");
          setUserId(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProjects, supabase]);

  const currentProject = projects.find((p) => p.id === currentProjectId);

  const setCurrentProject = (projectId: string) => {
    const exists = projects.find((p) => p.id === projectId);
    if (exists) {
      setCurrentProjectId(projectId);
    }
  };

  const updateProject = async (projectId: string, updates: Partial<ProjectSettings>) => {
    try {
      // Update local state immediately for UX
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? { ...p, settings: { ...p.settings, ...updates } }
            : p
        )
      );

      // Update database
      const updateData: Record<string, any> = {};
      if (updates.brandName !== undefined) updateData.brand_name = updates.brandName;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.website !== undefined) updateData.website = updates.website;
      if (updates.persona !== undefined) updateData.personality = updates.persona;
      if (updates.keywords !== undefined) updateData.keywords = updates.keywords;
      if (updates.watchedAccounts !== undefined) updateData.watched_accounts = updates.watchedAccounts;
      if (updates.autoPost !== undefined) updateData.auto_post = updates.autoPost;
      if (updates.whatsappDrafts !== undefined) updateData.whatsapp_drafts = updates.whatsappDrafts;
      if (updates.monitorReddit !== undefined) updateData.monitor_reddit = updates.monitorReddit;
      if (updates.dailyLimit !== undefined) updateData.daily_reply_limit = updates.dailyLimit;

      updateData.updated_at = new Date().toISOString();

      const result: any = await (supabase as any)
        .from("brand_agent")
        .update(updateData)
        .eq("id", projectId);

      if (result.error) {
        console.error("Failed to update project in database:", result.error);
        // Revert local state on error
        setProjects((prev) =>
          prev.map((p) =>
            p.id === projectId
              ? { ...p, settings: { ...p.settings, ...updates } }
              : p
          )
        );
      }
    } catch (error) {
      console.error("Error updating project:", error);
    }
  };

  const createProject = async (name: string) => {
    try {
      setIsLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error("No user logged in");
        return;
      }

      // Create in database
      const { data, error } = await (supabase
        .from("brand_agent")
        .insert([
          {
            user_id: user.id,
            name,
            brand_name: "",
            description: "",
            website: "",
            personality: "normal",
            keywords: "",
            watched_accounts: "",
            auto_post: false,
            whatsapp_drafts: true,
            monitor_reddit: true,
            daily_reply_limit: 30,
            is_active: true,
          },
        ] as any)
        .select()
        .single() as any);

      if (error) {
        console.error("Failed to create project in database:", error);
        return;
      }

      // Create local project object
      const newProject: Project = {
        id: (data as any).id,
        name,
        settings: { ...DEFAULT_SETTINGS },
      };

      setProjects((prev) => [...prev, newProject]);
      setCurrentProjectId(newProject.id);
    } catch (error) {
      console.error("Error creating project:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProjectsContext.Provider
      value={{
        projects,
        currentProjectId,
        currentProject,
        userId,
        setCurrentProject,
        updateProject,
        createProject,
        refreshProjects: loadProjects,
        isLoading,
      }}
    >
      {children}
    </ProjectsContext.Provider>
  );
};

export const useProjects = () => {
  const context = useContext(ProjectsContext);
  if (!context) {
    throw new Error("useProjects must be used within ProjectsProvider");
  }
  return context;
};
