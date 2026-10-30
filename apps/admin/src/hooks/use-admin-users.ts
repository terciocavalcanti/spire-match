"use client";

import type { AdminUserListQuery, CreateAdminUserRequest, UpdateAdminUserRolesRequest } from "@spire/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";

const ADMIN_USERS_KEY = ["admin-users"] as const;

export function useAdminUsers(query: Partial<AdminUserListQuery> = {}) {
  return useQuery({
    queryKey: [...ADMIN_USERS_KEY, query],
    queryFn: () => apiClient.adminUsers.list(query),
  });
}

export function useCreateAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAdminUserRequest) => apiClient.adminUsers.create(payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ADMIN_USERS_KEY }),
  });
}

export function useUpdateAdminUserRoles(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateAdminUserRolesRequest) => apiClient.adminUsers.updateRoles(id, payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ADMIN_USERS_KEY }),
  });
}

export function useRevokeAdminUserSessions() {
  return useMutation({
    mutationFn: (id: string) => apiClient.adminUsers.revokeSessions(id),
  });
}

export function useSetAdminUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "ACTIVE" | "SUSPENDED" }) =>
      status === "ACTIVE" ? apiClient.adminUsers.reactivate(id) : apiClient.adminUsers.suspend(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ADMIN_USERS_KEY }),
  });
}
