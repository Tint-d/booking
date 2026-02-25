/**
 * User types – params and entities for auth/users feature
 */

export type Role = "admin" | "owner" | "user";

export interface User {
  id: string;
  name: string;
  role: Role;
}

export interface UsersQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: "name" | "role" | "createdAt";
  sortOrder?: "asc" | "desc";
  role?: Role;
}

export interface UseUsersQueryParams {
  userId: string | null;
  enabled: boolean;
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: "name" | "role" | "createdAt";
  sortOrder?: "asc" | "desc";
  role?: Role;
}

export interface CreateUserVariables {
  userId: string;
  name: string;
  role: Role;
}

export interface UpdateUserRoleVariables {
  userId: string;
  targetUserId: string;
  role: Role;
}

export interface DeleteUserVariables {
  userId: string;
  targetUserId: string;
}
