import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Role } from '../../common/roles.enum';

export type UserDocument = User & Document;

@Schema({ timestamps: true, _id: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: Object.values(Role) })
  role: Role;
}

export const UserSchema = SchemaFactory.createForClass(User);
