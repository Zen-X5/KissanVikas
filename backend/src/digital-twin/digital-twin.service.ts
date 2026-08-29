import { Injectable, Logger, OnModuleInit, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DigitalTwin, DigitalTwinDocument, BedState, ZoneState } from './schemas';


@Injectable()
export class DigitalTwinService implements OnModuleInit {
  private readonly logger = new Logger(DigitalTwinService.name);
  private memoryDigitalTwin: any = null;

  constructor(
    @Optional() @InjectModel(DigitalTwin.name) private digitalTwinModel?: Model<DigitalTwinDocument>,
  ) {}

  async onModuleInit() {
    await this.initializePolyhouseTwin();
  }

  /**
   * Initializes the default 48-bed 60m x 30m Polyhouse Digital Twin structure.
   */
  async initializePolyhouseTwin() {
    const defaultZones: ZoneState[] = [
      {
        zone_id: 'ZONE_A',
        name: 'Zone A: Tomato Production',
        crop_type: 'tomato',
        bed_count: 12,
        average_health_score: 0.96,
        active_alerts: 0,
      },
      {
        zone_id: 'ZONE_B',
        name: 'Zone B: Capsicum Production',
        crop_type: 'capsicum',
        bed_count: 12,
        average_health_score: 0.94,
        active_alerts: 0,
      },
      {
        zone_id: 'ZONE_C',
        name: 'Zone C: Cucumber Production',
        crop_type: 'cucumber',
        bed_count: 12,
        average_health_score: 0.95,
        active_alerts: 0,
      },
      {
        zone_id: 'ZONE_D',
        name: 'Zone D: Eggplant Production',
        crop_type: 'eggplant',
        bed_count: 12,
        average_health_score: 0.97,
        active_alerts: 0,
      },
    ];

    const beds: BedState[] = [];
    const northYRows = [3.5, 5.5, 7.5, 9.5, 11.5, 13.5];
    const southYRows = [-3.5, -5.5, -7.5, -9.5, -11.5, -13.5];

    // Zone A (Tomato) & Zone B (Capsicum)
    northYRows.forEach((y, rIdx) => {
      beds.push({
        bed_id: `BED-TOM-${(rIdx * 2 + 1).toString().padStart(2, '0')}`,
        zone_id: 'ZONE_A',
        crop_type: 'tomato',
        variety: 'Arka Rakshak (High-Yield F1)',
        row_index: rIdx + 1,
        coordinates: { x_min: -26.0, x_max: -15.0, y_min: y - 0.6, y_max: y + 0.6, z_height: 1.8 },
        plant_count: 32,
        health_status: 'healthy',
        health_score: 0.96,
        moisture_percent: 68.5,
        temperature_c: 24.2,
        pest_risk: 'none',
        detected_issues: [],
      });
      beds.push({
        bed_id: `BED-TOM-${(rIdx * 2 + 2).toString().padStart(2, '0')}`,
        zone_id: 'ZONE_A',
        crop_type: 'tomato',
        variety: 'Arka Rakshak (High-Yield F1)',
        row_index: rIdx + 1,
        coordinates: { x_min: -14.0, x_max: -3.0, y_min: y - 0.6, y_max: y + 0.6, z_height: 1.8 },
        plant_count: 32,
        health_status: 'healthy',
        health_score: 0.95,
        moisture_percent: 67.8,
        temperature_c: 24.5,
        pest_risk: 'none',
        detected_issues: [],
      });

      beds.push({
        bed_id: `BED-CAP-${(rIdx * 2 + 1).toString().padStart(2, '0')}`,
        zone_id: 'ZONE_B',
        crop_type: 'capsicum',
        variety: 'Indra Bell Pepper',
        row_index: rIdx + 1,
        coordinates: { x_min: 3.0, x_max: 14.0, y_min: y - 0.6, y_max: y + 0.6, z_height: 0.85 },
        plant_count: 28,
        health_status: 'healthy',
        health_score: 0.94,
        moisture_percent: 65.2,
        temperature_c: 25.1,
        pest_risk: 'none',
        detected_issues: [],
      });
      beds.push({
        bed_id: `BED-CAP-${(rIdx * 2 + 2).toString().padStart(2, '0')}`,
        zone_id: 'ZONE_B',
        crop_type: 'capsicum',
        variety: 'Indra Bell Pepper',
        row_index: rIdx + 1,
        coordinates: { x_min: 15.0, x_max: 26.0, y_min: y - 0.6, y_max: y + 0.6, z_height: 0.85 },
        plant_count: 28,
        health_status: 'healthy',
        health_score: 0.95,
        moisture_percent: 66.0,
        temperature_c: 25.0,
        pest_risk: 'none',
        detected_issues: [],
      });
    });

    // Zone C (Cucumber) & Zone D (Eggplant)
    southYRows.forEach((y, rIdx) => {
      beds.push({
        bed_id: `BED-CUC-${(rIdx * 2 + 1).toString().padStart(2, '0')}`,
        zone_id: 'ZONE_C',
        crop_type: 'cucumber',
        variety: 'Poinsette Parthenocarpic',
        row_index: rIdx + 1,
        coordinates: { x_min: -26.0, x_max: -15.0, y_min: y - 0.6, y_max: y + 0.6, z_height: 1.4 },
        plant_count: 30,
        health_status: 'healthy',
        health_score: 0.95,
        moisture_percent: 71.0,
        temperature_c: 23.8,
        pest_risk: 'none',
        detected_issues: [],
      });
      beds.push({
        bed_id: `BED-CUC-${(rIdx * 2 + 2).toString().padStart(2, '0')}`,
        zone_id: 'ZONE_C',
        crop_type: 'cucumber',
        variety: 'Poinsette Parthenocarpic',
        row_index: rIdx + 1,
        coordinates: { x_min: -14.0, x_max: -3.0, y_min: y - 0.6, y_max: y + 0.6, z_height: 1.4 },
        plant_count: 30,
        health_status: 'healthy',
        health_score: 0.96,
        moisture_percent: 70.4,
        temperature_c: 24.0,
        pest_risk: 'none',
        detected_issues: [],
      });

      beds.push({
        bed_id: `BED-EGG-${(rIdx * 2 + 1).toString().padStart(2, '0')}`,
        zone_id: 'ZONE_D',
        crop_type: 'eggplant',
        variety: 'Janak Purple Brinjal',
        row_index: rIdx + 1,
        coordinates: { x_min: 3.0, x_max: 14.0, y_min: y - 0.6, y_max: y + 0.6, z_height: 0.95 },
        plant_count: 26,
        health_status: 'healthy',
        health_score: 0.97,
        moisture_percent: 64.5,
        temperature_c: 25.4,
        pest_risk: 'none',
        detected_issues: [],
      });
      beds.push({
        bed_id: `BED-EGG-${(rIdx * 2 + 2).toString().padStart(2, '0')}`,
        zone_id: 'ZONE_D',
        crop_type: 'eggplant',
        variety: 'Janak Purple Brinjal',
        row_index: rIdx + 1,
        coordinates: { x_min: 15.0, x_max: 26.0, y_min: y - 0.6, y_max: y + 0.6, z_height: 0.95 },
        plant_count: 26,
        health_status: 'healthy',
        health_score: 0.98,
        moisture_percent: 65.0,
        temperature_c: 25.2,
        pest_risk: 'none',
        detected_issues: [],
      });
    });

    const digitalTwinPayload = {
      polyhouse_id: 'POLYHOUSE-01',
      dimensions: { length_m: 60.0, width_m: 30.0, height_gutter_m: 4.2, height_ridge_m: 6.5 },
      zones: defaultZones,
      beds: beds,
      polyhouse_metrics: {
        overall_health_score: 0.96,
        total_beds: 48,
        total_area_sqm: 1800.0,
        last_survey_at: new Date(),
      },
    };

    this.memoryDigitalTwin = digitalTwinPayload;

    if (this.digitalTwinModel) {
      try {
        await this.digitalTwinModel.findOneAndUpdate(
          { polyhouse_id: 'POLYHOUSE-01' },
          { $setOnInsert: digitalTwinPayload },
          { upsert: true, new: true }
        );
        this.logger.log('✅ [DIGITAL TWIN] 48-Bed Polyhouse Spatial Twin initialized in MongoDB');
      } catch (err) {
        this.logger.warn(`Digital Twin initialized in memory fallback: ${err.message}`);
      }
    }
  }

  /**
   * Updates the digital twin directly from Sahid's AI Services Spatial Twin JSON output.
   */
  async updateFromSpatialTwin(spatialTwin: any) {
    const summary = spatialTwin?.summary || {};
    const objects = spatialTwin?.objects || [];

    const existing = await this.getDigitalTwin();
    const updated = {
      ...existing,
      polyhouse_metrics: {
        overall_health_score: summary.overall_health_score ?? existing?.polyhouse_metrics?.overall_health_score ?? 0.96,
        total_beds: summary.total_beds ?? existing?.polyhouse_metrics?.total_beds ?? 48,
        total_crops_detected: summary.total_crops_detected ?? objects.filter((o: any) => o.type === 'crop').length,
        total_area_sqm: 1800.0,
        last_survey_at: new Date(),
      },
      spatial_twin_raw: spatialTwin,
    };

    this.memoryDigitalTwin = updated;

    if (this.digitalTwinModel) {
      try {
        await this.digitalTwinModel.findOneAndUpdate(
          { polyhouse_id: 'POLYHOUSE-01' },
          { $set: updated },
          { upsert: true, new: true }
        );
        this.logger.log('🌟 [DIGITAL TWIN UPDATED] Synced latest AI Spatial Twin to MongoDB Atlas');
      } catch (err) {
        this.logger.warn(`Digital twin update saved in memory: ${err.message}`);
      }
    }

    return updated;
  }

  async getDigitalTwin() {
    if (this.digitalTwinModel) {
      try {
        const doc = await this.digitalTwinModel.findOne({ polyhouse_id: 'POLYHOUSE-01' }).lean();
        if (doc) return doc;
      } catch (err) {
        this.logger.warn(`Reading digital twin from memory fallback: ${err.message}`);
      }
    }
    return this.memoryDigitalTwin;
  }

  async getBed(bedId: string) {
    const twin = await this.getDigitalTwin();
    const bed = twin?.beds?.find((b: BedState) => b.bed_id.toLowerCase() === bedId.toLowerCase());
    return bed || { error: 'Bed not found', bed_id: bedId };
  }

  async getHeatmap() {
    const twin = await this.getDigitalTwin();
    return {
      polyhouse_id: 'POLYHOUSE-01',
      grid_dimensions: { rows: 12, cols: 4 },
      cells: twin?.beds?.map((b: BedState) => ({
        bed_id: b.bed_id,
        zone_id: b.zone_id,
        crop_type: b.crop_type,
        health_score: b.health_score,
        moisture_percent: b.moisture_percent,
        temperature_c: b.temperature_c,
        status: b.health_status,
      })),
    };
  }
}
