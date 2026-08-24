import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type PolyhouseDocument = HydratedDocument<Polyhouse>;

@Schema({ timestamps: true })
export class Polyhouse {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true })
  userId: mongoose.Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({
    type: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    required: true,
    _id: false,
  })
  location: {
    latitude: number;
    longitude: number;
  };

  @Prop({
    type: {
      lengthM: { type: Number, default: 60.0 },
      widthM: { type: Number, default: 30.0 },
      heightM: { type: Number, default: 6.5 },
    },
    _id: false,
  })
  dimensions: {
    lengthM: number;
    widthM: number;
    heightM: number;
  };

  @Prop({
    enum: ['active', 'inactive', 'under_survey', 'maintenance'],
    default: 'active',
  })
  status: string;

  @Prop({
    enum: ['not_created', 'building', 'ready', 'updating'],
    default: 'not_created',
  })
  twinStatus: string;
}

export const PolyhouseSchema = SchemaFactory.createForClass(Polyhouse);
