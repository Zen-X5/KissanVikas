import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SurveyFrameDocument = HydratedDocument<SurveyFrame>;

@Schema({ timestamps: true })
export class SurveyFrame {
  @Prop({ required: true, ref: 'Mission', index: true })
  missionId: string;

  @Prop({ required: true, index: true })
  droneId: string;

  @Prop({ required: true })
  frameId: string;

  @Prop({ required: true })
  sequenceNumber: number;

  @Prop({
    required: true,
    enum: ['perimeter_scan', 'interior_scan'],
    index: true,
  })
  stage: string;

  @Prop({ required: true, index: true })
  timestamp: Date;

  @Prop({
    type: {
      url: { type: String, required: true },
      width: { type: Number, required: true },
      height: { type: Number, required: true },
    },
    required: true,
    _id: false,
  })
  image: {
    url: string;
    width: number;
    height: number;
  };

  @Prop({
    type: {
      position: {
        xM: { type: Number, required: true },
        yM: { type: Number, required: true },
        zM: { type: Number, required: true },
      },
      orientation: {
        rollDeg: { type: Number, required: true },
        pitchDeg: { type: Number, required: true },
        yawDeg: { type: Number, required: true },
      },
    },
    required: true,
    _id: false,
  })
  dronePose: {
    position: {
      xM: number;
      yM: number;
      zM: number;
    };
    orientation: {
      rollDeg: number;
      pitchDeg: number;
      yawDeg: number;
    };
  };

  @Prop({
    type: {
      fovDeg: { type: Number, required: true },
      gimbalPitchDeg: { type: Number, required: true },
      gimbalYawDeg: { type: Number, required: true },
    },
    required: true,
    _id: false,
  })
  camera: {
    fovDeg: number;
    gimbalPitchDeg: number;
    gimbalYawDeg: number;
  };
}

export const SurveyFrameSchema = SchemaFactory.createForClass(SurveyFrame);
SurveyFrameSchema.index({ missionId: 1, frameId: 1 }, { unique: true });
SurveyFrameSchema.index({ missionId: 1, sequenceNumber: 1 });
