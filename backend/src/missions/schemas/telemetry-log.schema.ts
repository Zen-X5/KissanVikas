import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TelemetryLogDocument = HydratedDocument<TelemetryLog>;

@Schema({ timestamps: true })
export class TelemetryLog {
  @Prop({ required: true, ref: 'Mission', index: true })
  missionId: string;

  @Prop({ required: true, index: true })
  droneId: string;

  @Prop({ required: true, index: true })
  timestamp: Date;

  @Prop({
    required: true,
    enum: ['perimeter_scan', 'interior_scan'],
    index: true,
  })
  stage: string;

  @Prop({
    type: {
      xM: { type: Number, required: true },
      yM: { type: Number, required: true },
      zM: { type: Number, required: true },
    },
    required: true,
    _id: false,
  })
  position: {
    xM: number;
    yM: number;
    zM: number;
  };

  @Prop({ required: true })
  altitudeM: number;

  @Prop({ required: true })
  speedMps: number;

  @Prop({ required: true })
  headingDeg: number;

  @Prop({ required: true, min: 0, max: 100 })
  batteryPercent: number;
}

export const TelemetryLogSchema = SchemaFactory.createForClass(TelemetryLog);
TelemetryLogSchema.index({ missionId: 1, timestamp: -1 });
