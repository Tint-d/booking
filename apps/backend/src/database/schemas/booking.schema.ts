import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BookingDocument = Booking & Document;

@Schema({ timestamps: true })
export class Booking {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, type: Date })
  startTime: Date;

  @Prop({ required: true, type: Date })
  endTime: Date;

  @Prop({ default: () => new Date(), type: Date })
  createdAt: Date;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);

// Index for overlap queries and sort
BookingSchema.index({ startTime: 1, endTime: 1 });
BookingSchema.index({ userId: 1 });
BookingSchema.index({ createdAt: -1 });
