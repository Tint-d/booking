import { IsOptional, IsIn } from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination.dto';
import { Role } from '../../common/roles.enum';

const SORT_FIELDS = ['name', 'role', 'createdAt'] as const;

export class ReadUsersQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(SORT_FIELDS)
  sortBy?: (typeof SORT_FIELDS)[number] = 'name';

  /** Filter by role */
  @IsOptional()
  @IsIn(Object.values(Role))
  role?: Role;
}
