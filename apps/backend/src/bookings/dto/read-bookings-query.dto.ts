import { IsOptional, IsString, IsIn } from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination.dto';

const SORT_FIELDS = ['startTime', 'endTime', 'createdAt', 'userId'] as const;

export class ReadBookingsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(SORT_FIELDS)
  sortBy?: (typeof SORT_FIELDS)[number] = 'startTime';

  /** Filter by creator user id */
  @IsOptional()
  @IsString()
  userId?: string;
}
