import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DigitalTwinDocument = HydratedDocument<DigitalTwin>;

export class BedState {
  bed_id: string; // e.g. BED-TOM-01
  zone_id: string; // ZONE_A
  crop_type: string; // tomato, capsicum, cucumber, eggplant
  variety: string;
  row_index: number;
  coordinates: {
    x_min: number;
    x_max: number;
    y_min: number;
    y_max: number;
    z_height: number;
  };
  plant_count: number;
  health_status: 'healthy' | 'attention' | 'critical';
  health_score: number; // 0.0 - 1.0
  moisture_percent: number;
  temperature_c: number;
  pest_risk: 'none' | 'low' | 'moderate' | 'high';
  detected_issues: string[];
  last_scanned_at?: Date;
  latest_frame_id?: string;
  latest_frame_url?: string;
}

export class ZoneState {
  zone_id: string;
  name: string;
  crop_type: string;
  bed_count: number;
  average_health_score: number;
  active_alerts: number;
}

@Schema({ timestamps: true })
export class DigitalTwin {
  @Prop({ required: true, default: 'POLYHOUSE-01', unique: true })
  polyhouse_id: string;

  @Prop({ type: Object, default: { length_m: 60.0, width_m: 30.0, height_gutter_m: 4.2, height_ridge_m: 6.5 } })
  dimensions: {
    length_m: number;
    width_m: number;
    height_gutter_m: number;
    height_ridge_m: number;
  };

  @Prop({ type: Array, default: [] })
  zones: ZoneState[];

  @Prop({ type: Array, default: [] })
  beds: BedState[];

  @Prop({ type: Object, default: {} })
  polyhouse_metrics: {
    overall_health_score: number;
    total_beds: number;
    total_area_sqm: number;
    last_survey_at?: Date;
    last_survey_mission_id?: string;
  };
}

export const DigitalTwinSchema = SchemaFactory.createForClass(DigitalTwin);
