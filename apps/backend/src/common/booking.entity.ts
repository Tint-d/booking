export interface BookingEntity {
  id: string;
  userId: string;
  startTime: string; // ISO 8601
  endTime: string;
  createdAt: string; // ISO 8601
}
