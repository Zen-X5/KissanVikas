import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MissionEventDocument = HydratedDocument<MissionEvent>;

@Schema({ timestamps: true })
export class MissionEvent {
  @Prop({ required: true, ref: 'Mission', index: true })
  missionId: string;

  @Prop({ required: true, index: true })
  droneId: string;

  @Prop({
    required: true,
    enum: [
      'takeoff_started',
      'perimeter_scan_started',
      'perimeter_scan_completed',
      'interior_scan_started',
      'interior_scan_completed',
      'landing_started',
      'landing_completed',
      'mission_completed',
    ],
    index: true,
  })
  eventType: string;

  @Prop({
    type: String,
    enum: ['perimeter_scan', 'interior_scan', 'landing', null],
    default: null,
  })
  stage?: string | null;

  @Prop({ required: true, index: true })
  timestamp: Date;

  @Prop({
    type: {
      framesCaptured: { type: Number, default: null },
      flightDistanceM: { type: Number, default: null },
      durationSeconds: { type: Number, default: null },
      coveragePercent: { type: Number, default: null },
    },
    default: {},
    _id: false,
  })
  statistics?: {
    framesCaptured?: number | null;
    flightDistanceM?: number | null;
    durationSeconds?: number | null;
    coveragePercent?: number | null;
  };
}

export const MissionEventSchema = SchemaFactory.createForClass(MissionEvent);
MissionEventSchema.index({ missionId: 1, timestamp: 1 });
