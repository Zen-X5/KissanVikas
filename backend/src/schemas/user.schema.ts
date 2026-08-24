import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({
    required: true,
    enum: ['admin', 'customer'],
    default: 'customer',
  })
  role: string;

  @Prop({
    required: true,
    enum: ['active', 'suspended'],
    default: 'active',
  })
  status: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
