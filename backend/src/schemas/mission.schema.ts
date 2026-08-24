import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type MissionDocument = HydratedDocument<Mission>;

@Schema({ timestamps: true })
export class Mission {
  @Prop({ required: true, unique: true, index: true })
  _id: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Polyhouse', required: false, index: true })
  polyhouseId?: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false })
  requestedBy?: mongoose.Types.ObjectId;

  @Prop({ default: 'DRONE-001' })
  droneId: string;

  @Prop({
    enum: ['initial_mapping', 'resurvey', 'inspection'],
    default: 'initial_mapping',
  })
  surveyType: string;

  @Prop({
    enum: ['planned', 'dispatched', 'flying', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'planned',
    index: true,
  })
  status: string;

  @Prop({
    type: {
      perimeterScan: { type: Boolean, default: true },
      interiorScan: { type: Boolean, default: true },
    },
    default: { perimeterScan: true, interiorScan: true },
    _id: false,
  })
  surveyStages: {
    perimeterScan: boolean;
    interiorScan: boolean;
  };

  @Prop({ default: Date.now })
  requestedAt: Date;

  @Prop({ default: null })
  dispatchedAt?: Date;

  @Prop({ default: null })
  startedAt?: Date;

  @Prop({ default: null })
  completedAt?: Date;

  @Prop({
    type: {
      framesCaptured: { type: Number, default: 0 },
      flightDistanceM: { type: Number, default: 0 },
      coveragePercent: { type: Number, default: 0 },
    },
    default: { framesCaptured: 0, flightDistanceM: 0, coveragePercent: 0 },
    _id: false,
  })
  statistics: {
    framesCaptured: number;
    flightDistanceM: number;
    coveragePercent: number;
  };

  @Prop({
    type: {
      code: { type: String, default: null },
      message: { type: String, default: null },
    },
    default: null,
    _id: false,
  })
  error?: {
    code: string | null;
    message: string | null;
  };
}

export const MissionSchema = SchemaFactory.createForClass(Mission);
