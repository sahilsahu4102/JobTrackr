import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import type { Application, ApplicationStatus } from '../types';

interface ApplicationsResponse {
  success: boolean;
  count: number;
  data: Application[];
}

export const useApplications = () => {
  return useQuery({
    queryKey: ['applications'],
    queryFn: async () => {
      const { data } = await api.get<ApplicationsResponse>('/applications');
      return data.data;
    },
  });
};

export const useUpdateApplicationStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, order }: { id: string; status: ApplicationStatus; order: number }) => {
      const { data } = await api.patch(`/applications/${id}/status`, { status, order });
      return data;
    },
    onMutate: async (newApp) => {
      // Cancel any outgoing refetches so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: ['applications'] });

      // Snapshot the previous value
      const previousApps = queryClient.getQueryData<Application[]>(['applications']);

      // Optimistically update to the new value
      if (previousApps) {
        queryClient.setQueryData<Application[]>(['applications'], (old) =>
          old?.map((app) =>
            app._id === newApp.id ? { ...app, status: newApp.status, order: newApp.order } : app
          )
        );
      }

      return { previousApps };
    },
    onError: (_err, _newApp, context) => {
      // If mutation fails, restore previous data
      if (context?.previousApps) {
        queryClient.setQueryData(['applications'], context.previousApps);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
};

export const useUpdateApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Application> }) => {
      const res = await api.put(`/applications/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
};

export const useBatchReorder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: { id: string; status: ApplicationStatus; order: number }[]) => {
      const { data } = await api.patch('/applications/reorder', { applications: updates });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
};

export const useCreateApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newApplication: Partial<Application>) => {
      const { data } = await api.post('/applications', newApplication);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
};

export const useDeleteApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/applications/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
};

export const useAddActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, text }: { id: string; text: string }) => {
      const { data } = await api.post(`/applications/${id}/activities`, { text });
      return data.data; // Return the updated application
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
};

export const useParseJD = () => {
  return useMutation({
    mutationFn: async (payload: { url?: string; text?: string }) => {
      const { data } = await api.post('/ai/parse-jd', payload);
      return data.data; // Ensure this extracts the inner ParsedJobDescription mapped data
    },
  });
};
