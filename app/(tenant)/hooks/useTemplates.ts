'use client';

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { ApiError, tenantApi } from "@/lib/api";

export type Template = {
  id: string;
  name: string;
  category: string;
  description?: string;
  body: string;
  platforms: string[];
  uses?: number;
  created_at: string;
  updated_at: string;
};

export function useTemplates() {
  return useQuery<Template[], Error>({
    queryKey: ["templates"],
    queryFn: async () => {
      try {
        const response = await tenantApi.templates();
        const templates = response?.templates;
        if (!Array.isArray(templates)) {
          return [];
        }
        return templates.map((template) => ({
          id: template.id,
          name: template.name,
          category: template.category,
          description: template.description,
          body: template.body,
          platforms: Array.isArray(template.platforms) ? template.platforms : [],
          uses: template.uses,
          created_at: template.created_at,
          updated_at: template.updated_at,
        }));
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          return [];
        }
        throw error;
      }
    },
    refetchOnMount: "always",
  });
}

export function useTemplate(templateId: string | null) {
  return useQuery<Template | null, Error>({
    queryKey: ["template", templateId],
    enabled: Boolean(templateId),
    queryFn: async () => {
      if (!templateId) {
        return null;
      }
      try {
        const response = await tenantApi.template(templateId);
        return {
          id: response.template.id,
          name: response.template.name,
          category: response.template.category,
          description: response.template.description,
          body: response.template.body,
          platforms: response.template.platforms,
          uses: response.template.uses,
          created_at: response.template.created_at,
          updated_at: response.template.updated_at,
        };
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          return null;
        }
        throw error;
      }
    },
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      name: string;
      category: string;
      description?: string;
      body: string;
      platforms: string[];
    }) => {
      return tenantApi.createTemplate(payload);
    },
    onSuccess: () => {
      toast.success("Template created successfully");
      void queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.message || "Failed to create template");
      } else {
        toast.error("Unable to create template. Please try again.");
      }
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      templateId,
      payload,
    }: {
      templateId: string;
      payload: {
        name?: string;
        category?: string;
        description?: string;
        body?: string;
        platforms?: string[];
      };
    }) => {
      return tenantApi.updateTemplate(templateId, payload);
    },
    onSuccess: () => {
      toast.success("Template updated successfully");
      void queryClient.invalidateQueries({ queryKey: ["templates"] });
      void queryClient.invalidateQueries({ queryKey: ["template"] });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.message || "Failed to update template");
      } else {
        toast.error("Unable to update template. Please try again.");
      }
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId: string) => {
      return tenantApi.deleteTemplate(templateId);
    },
    onSuccess: () => {
      toast.success("Template deleted successfully");
      void queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.message || "Failed to delete template");
      } else {
        toast.error("Unable to delete template. Please try again.");
      }
    },
  });
}

