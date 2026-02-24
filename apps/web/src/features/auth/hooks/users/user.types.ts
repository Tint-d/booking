/**
 * User types – params and entities for auth/users feature
 */

export type Role = "admin" | "owner" | "user";

export interface User {
  id: string;
  name: string;
  role: Role;
}

export interface UseUsersQueryParams {
  userId: string | null;
  enabled: boolean;
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
