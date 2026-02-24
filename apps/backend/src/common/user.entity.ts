import { Role } from './roles.enum';

export interface UserEntity {
  id: string;
  name: string;
  role: Role;
}
