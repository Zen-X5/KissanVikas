import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Mission, MissionDocument } from '../schemas/mission.schema';
import { SurveyFrame, SurveyFrameDocument } from '../schemas/survey-frame.schema';
import { TelemetryLog, TelemetryLogDocument } from '../schemas/telemetry-log.schema';
import { MissionEvent, MissionEventDocument } from '../schemas/mission-event.schema';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { DigitalTwinService } from '../digital-twin/digital-twin.service';

@Injectable()
export class MissionsService {
  private readonly logger = new Logger(MissionsService.name);

  // In-Memory Fast Cache for real-time streaming & offline fallback
  private latestTelemetryCache: Map<string, any> = new Map();
  private memoryMissions: Map<string, any> = new Map();
  private memoryFrames: Map<string, any[]> = new Map();
  private memoryEvents: Map<string, any[]> = new Map();

  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly digitalTwinService: DigitalTwinService,
    @Optional() @InjectModel(Mission.name) private missionModel?: Model<MissionDocument>,
    @Optional() @InjectModel(SurveyFrame.name) private frameModel?: Model<SurveyFrameDocument>,
    @Optional() @InjectModel(TelemetryLog.name) private telemetryModel?: Model<TelemetryLogDocument>,
    @Optional() @InjectModel(MissionEvent.name) private eventModel?: Model<MissionEventDocument>,
  ) {}

  /**
   * Ingests lifecycle handshakes (takeoff, perimeter_started/completed, interior_started/completed, landing, completed)
   */
  async recordEvent(missionId: string, eventType: string, payload: any) {
    const droneId = payload.drone_id || payload.droneId || 'DRONE-001';
    const timestamp = new Date(payload.timestamp || new Date());
    const stage = payload.stage || null;
    const statistics = payload.statistics
      ? {
          framesCaptured: payload.statistics.frames_captured ?? payload.statistics.framesCaptured ?? null,
          flightDistanceM: payload.statistics.flight_distance_m ?? payload.statistics.flightDistanceM ?? null,
          durationSeconds: payload.statistics.duration_seconds ?? payload.statistics.durationSeconds ?? null,
          coveragePercent: payload.statistics.coverage_percent ?? payload.statistics.coveragePercent ?? null,
        }
      : {};

    this.logger.log(`📥 [EVENT INGESTED] ${missionId} -> ${eventType} [Stage: ${stage || 'N/A'}]`);

    // 1. In-Memory Cache Update
    const cached = this.memoryMissions.get(missionId) || {
      _id: missionId,
      droneId: droneId,
      status: 'planned',
      surveyStages: { perimeterScan: true, interiorScan: true },
      requestedAt: timestamp,
      startedAt: timestamp,
      statistics: { framesCaptured: 0, flightDistanceM: 0, coveragePercent: 0 },
    };

    if (eventType === 'takeoff' || eventType === 'takeoff_started') {
      cached.status = 'flying';
      cached.startedAt = timestamp;
    } else if (eventType === 'completed' || eventType === 'mission_completed') {
      cached.status = 'completed';
      cached.completedAt = timestamp;
      if (statistics.framesCaptured) cached.statistics.framesCaptured = statistics.framesCaptured;
      if (statistics.flightDistanceM) cached.statistics.flightDistanceM = statistics.flightDistanceM;
      if (statistics.coveragePercent) cached.statistics.coveragePercent = statistics.coveragePercent;

      // Trigger asynchronous AI Digital Twin reconstruction
      this.triggerAiReconstruction(missionId).catch((err) => {
        this.logger.warn(`AI reconstruction background trigger notice: ${err.message}`);
      });
    }

    this.memoryMissions.set(missionId, cached);

    const eventRecord = {
      missionId,
      droneId,
      eventType: this._mapEventType(eventType, payload.status),
      stage,
      timestamp,
      statistics,
    };

    const eventList = this.memoryEvents.get(missionId) || [];
    eventList.push(eventRecord);
    this.memoryEvents.set(missionId, eventList);

    // 2. Persist to MongoDB
    if (this.missionModel) {
      try {
        await this.missionModel.findOneAndUpdate(
          { _id: missionId },
          {
            $set: {
              droneId: cached.droneId,
              status: cached.status,
              completedAt: cached.completedAt,
              statistics: cached.statistics,
            },
            $setOnInsert: {
              startedAt: cached.startedAt,
              requestedAt: cached.requestedAt,
            },
          },
          { upsert: true, new: true }
        );
      } catch (err) {
        this.logger.warn(`Mission write buffered in memory: ${err.message}`);
      }
    }

    if (this.eventModel) {
      try {
        await this.eventModel.create(eventRecord);
      } catch (err) {
        this.logger.warn(`MissionEvent write buffered in memory: ${err.message}`);
      }
    }

    return {
      success: true,
      mission_id: missionId,
      status: payload.status || eventType,
      ...(statistics.framesCaptured ? { frames_received: statistics.framesCaptured } : {}),
    };
  }

  /**
   * Dispatches survey frames to Sahid's FastAPI AI Vision Service
   * to compute the complete Polyhouse Spatial Digital Twin.
   */
  async triggerAiReconstruction(missionId: string) {
    try {
      const frames = await this.getFrames(missionId, 300);
      if (!frames || frames.length === 0) {
        this.logger.log(`[AI SYNC] No frames to reconstruct for mission ${missionId}`);
        return;
      }

      this.logger.log(`🚀 [AI SYNC TRIGGERED] Dispatching ${frames.length} frames to AI Services on http://127.0.0.1:8000/vision/analyze-batch`);

      const formattedFrames = frames.map((f: any) => ({
        mission_id: missionId,
        drone_id: f.droneId || 'DRONE-001',
        frame_id: f.frameId,
        sequence_number: f.sequenceNumber || 1,
        stage: f.stage || 'interior_scan',
        timestamp: f.timestamp,
        image: {
          url: f.image?.url || '',
          width: f.image?.width || 1920,
          height: f.image?.height || 1080,
        },
        drone_pose: {
          position: {
            x_m: f.dronePose?.position?.xM ?? 0,
            y_m: f.dronePose?.position?.yM ?? 0,
            z_m: f.dronePose?.position?.zM ?? 0,
          },
          orientation: {
            roll_deg: f.dronePose?.orientation?.rollDeg ?? 0,
            pitch_deg: f.dronePose?.orientation?.pitchDeg ?? -5,
            yaw_deg: f.dronePose?.orientation?.yawDeg ?? 0,
          },
        },
        camera: {
          fov_deg: f.camera?.fovDeg ?? 78.0,
          gimbal_pitch_deg: f.camera?.gimbalPitchDeg ?? -60.0,
          gimbal_yaw_deg: f.camera?.gimbalYawDeg ?? 0.0,
        },
      }));

      const res = await fetch('http://127.0.0.1:8000/vision/analyze-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mission_id: missionId,
          polyhouse_id: 'PH-DEMO-001',
          frames: formattedFrames,
        }),
      });

      if (res.ok) {
        const spatialTwin = await res.json();
        await this.digitalTwinService.updateFromSpatialTwin(spatialTwin);
        this.logger.log(`🎉 [AI SYNC SUCCESS] Mission ${missionId} Digital Twin reconstructed and saved to MongoDB Atlas!`);
      } else {
        this.logger.warn(`AI Service responded with status: ${res.status}`);
      }
    } catch (err: any) {
      this.logger.warn(`AI Service unreachable or offline (skipping auto-sync): ${err.message}`);
    }
  }

  /**
   * Ingests 200-500ms live telemetry streams
   */
  async recordTelemetry(telemetryPayload: any) {
    const missionId = telemetryPayload.mission_id || telemetryPayload.missionId;
    const droneId = telemetryPayload.drone_id || telemetryPayload.droneId || 'DRONE-001';
    const timestamp = new Date(telemetryPayload.timestamp || new Date());
    const stage = telemetryPayload.stage;
    const pos = telemetryPayload.position || {};

    const record = {
      missionId,
      droneId,
      timestamp,
      stage,
      position: {
        xM: pos.x_m ?? pos.xM ?? 0,
        yM: pos.y_m ?? pos.yM ?? 0,
        zM: pos.z_m ?? pos.zM ?? 0,
      },
      altitudeM: telemetryPayload.altitude_m ?? telemetryPayload.altitudeM ?? 0,
      speedMps: telemetryPayload.speed_mps ?? telemetryPayload.speedMps ?? 0,
      headingDeg: telemetryPayload.heading_deg ?? telemetryPayload.headingDeg ?? 0,
      batteryPercent: telemetryPayload.battery_percent ?? telemetryPayload.batteryPercent ?? 100,
    };

    this.latestTelemetryCache.set(missionId, record);

    if (this.telemetryModel) {
      try {
        await this.telemetryModel.create(record);
      } catch (err) {
        // High-frequency telemetry failure is non-blocking
      }
    }

    return { success: true };
  }

  getLatestTelemetry(missionId: string) {
    return this.latestTelemetryCache.get(missionId) || null;
  }

  /**
   * Ingests and stores survey frames with spatial poses & camera angles
   */
  async recordFrame(framePayload: any) {
    const missionId = framePayload.mission_id || framePayload.missionId;
    const frameId = framePayload.frame_id || framePayload.frameId;
    const droneId = framePayload.drone_id || framePayload.droneId || 'DRONE-001';
    const sequenceNumber = framePayload.sequence_number ?? framePayload.sequenceNumber ?? 1;
    const stage = framePayload.stage?.trim();
    const timestamp = new Date(framePayload.timestamp || new Date());

    const img = framePayload.image || {};
    const pose = framePayload.drone_pose || framePayload.dronePose || {};
    const pos = pose.position || {};
    const orient = pose.orientation || {};
    const cam = framePayload.camera || {};

    // Process image URL (Upload to Cloudinary if configured)
    const finalImageUrl = await this.cloudinaryService.processFrameImage(img.url, missionId, frameId);

    const record = {
      missionId,
      droneId,
      frameId,
      sequenceNumber,
      stage,
      timestamp,
      image: {
        url: finalImageUrl,
        width: img.width || 1920,
        height: img.height || 1080,
      },
      dronePose: {
        position: {
          xM: pos.x_m ?? pos.xM ?? 0,
          yM: pos.y_m ?? pos.yM ?? 0,
          zM: pos.z_m ?? pos.zM ?? 0,
        },
        orientation: {
          rollDeg: orient.roll_deg ?? orient.rollDeg ?? 0,
          pitchDeg: orient.pitch_deg ?? orient.pitchDeg ?? -5,
          yawDeg: orient.yaw_deg ?? orient.yawDeg ?? 0,
        },
      },
      camera: {
        fovDeg: cam.fov_deg ?? cam.fovDeg ?? 78.0,
        gimbalPitchDeg: cam.gimbal_pitch_deg ?? cam.gimbalPitchDeg ?? -60.0,
        gimbalYawDeg: cam.gimbal_yaw_deg ?? cam.gimbalYawDeg ?? 0.0,
      },
    };

    // Buffer in Memory
    const list = this.memoryFrames.get(missionId) || [];
    list.push(record);
    this.memoryFrames.set(missionId, list);

    const totalCount = list.length;
    this.logger.log(`📸 [FRAME STORED #${totalCount}] Mission: ${missionId} | Frame: ${frameId} (Seq: ${sequenceNumber}) [${stage}]`);

    // Persist in MongoDB
    if (this.frameModel) {
      try {
        await this.frameModel.findOneAndUpdate(
          { missionId, frameId },
          { $set: record },
          { upsert: true, new: true }
        );
      } catch (err) {
        this.logger.warn(`Frame write buffered in memory: ${err.message}`);
      }
    }

    return {
      success: true,
      mission_id: missionId,
      frame_id: frameId,
      stored: true,
    };
  }

  async getFrames(missionId: string, limit: number = 250) {
    if (this.frameModel) {
      try {
        const docs = await this.frameModel
          .find({ missionId })
          .sort({ sequenceNumber: 1 })
          .limit(limit)
          .lean();
        if (docs.length > 0) return docs;
      } catch (err) {
        this.logger.warn(`Reading frames from memory: ${err.message}`);
      }
    }
    return this.memoryFrames.get(missionId) || [];
  }

  async getMission(missionId: string) {
    if (this.missionModel) {
      try {
        const doc = await this.missionModel.findOne({ _id: missionId }).lean();
        if (doc) return doc;
      } catch (err) {
        this.logger.warn(`Reading mission from memory: ${err.message}`);
      }
    }
    return this.memoryMissions.get(missionId) || { _id: missionId, status: 'planned' };
  }

  async listMissions() {
    if (this.missionModel) {
      try {
        const docs = await this.missionModel.find().sort({ createdAt: -1 }).limit(20).lean();
        if (docs.length > 0) return docs;
      } catch (err) {
        this.logger.warn(`Listing missions from memory: ${err.message}`);
      }
    }
    return Array.from(this.memoryMissions.values());
  }

  private _mapEventType(eventType: string, status?: string): string {
    if (eventType === 'takeoff' || status === 'taking_off') return 'takeoff_started';
    if (eventType === 'perimeter_scan' && status === 'started') return 'perimeter_scan_started';
    if (eventType === 'perimeter_scan' && status === 'completed') return 'perimeter_scan_completed';
    if (eventType === 'interior_scan' && status === 'started') return 'interior_scan_started';
    if (eventType === 'interior_scan' && status === 'completed') return 'interior_scan_completed';
    if (eventType === 'landing' || status === 'landing') return 'landing_started';
    if (eventType === 'landed' || status === 'landed') return 'landing_completed';
    if (eventType === 'completed' || status === 'completed') return 'mission_completed';
    return eventType;
  }
}
