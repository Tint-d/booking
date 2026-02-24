import { Role } from '../../common/roles.enum';

export class CreateUserDto {
  name!: string;
  role!: Role;
}
