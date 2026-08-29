import { Body, Controller, Get, Param, Post, Res, Query, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import * as http from 'http';
import { MissionsService } from './missions.service';

@Controller('api/v1/missions')
export class MissionsController {
  constructor(private readonly missionsService: MissionsService) {}

  // ----------------------------------------------------
  // 1. LIVE CAMERA STREAM PROXY (Proxies port 8080 to web clients)
  // ----------------------------------------------------
  @Get(':id/stream')
  streamDroneCamera(@Param('id') id: string, @Res() res: Response) {
    const droneStreamUrl = process.env.DRONE_STREAM_URL || 'http://localhost:8080/camera/stream';

    res.setHeader('Content-Type', 'multipart/x-mixed-replace; boundary=FRAME');
    res.setHeader('Cache-Control', 'no-cache, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const req = http.get(droneStreamUrl, (streamRes) => {
      streamRes.pipe(res);
    });

    req.on('error', () => {
      res.status(HttpStatus.SERVICE_UNAVAILABLE).send(`Drone camera stream currently unavailable at ${droneStreamUrl}`);
    });
  }

  // ----------------------------------------------------
  // 1.5. AUTONOMOUS MISSION DISPATCH & LIVE LOG STREAMING
  // ----------------------------------------------------
  @Post('dispatch')
  async dispatchMission(
    @Body()
    body: {
      missionId?: string;
      droneId?: string;
      polyhouseId?: string;
      requestedBy?: string;
      speed?: number;
      mode?: 'direct' | 'sitl';
    },
  ) {
    const missionId = body.missionId || `MISSION-${Date.now().toString().slice(-6)}`;
    const droneId = body.droneId || 'DRONE-001';
    const speed = body.speed || 1.5;
    const mode = body.mode || 'sitl';

    // Record initial planned event in DB
    await this.missionsService.recordEvent(missionId, 'planned', {
      drone_id: droneId,
      polyhouseId: body.polyhouseId,
      requestedBy: body.requestedBy,
      mode: mode,
      timestamp: new Date().toISOString(),
    });

    // Auto-spawn the simulation flight process in background
    const spawnResult = this.missionsService.spawnSimulationProcess(missionId, droneId, speed, mode);

    return {
      success: true,
      mission_id: missionId,
      drone_id: droneId,
      mode: mode,
      message: spawnResult.message,
      command: spawnResult.command,
    };
  }

  @Get(':id/logs')
  getMissionLogs(@Param('id') id: string) {
    const logs = this.missionsService.getMissionLogs(id);
    return {
      success: true,
      mission_id: id,
      total_lines: logs.length,
      logs: logs,
    };
  }

  // ----------------------------------------------------
  // 2. LIFECYCLE EVENTS HANDSHAKE
  // ----------------------------------------------------

  @Post('events/takeoff')
  async handleTakeoff(@Body() payload: any) {
    await this.missionsService.recordEvent(payload.mission_id, 'takeoff', payload);
    return {
      success: true,
      mission_id: payload.mission_id,
      status: 'taking_off',
    };
  }

  @Post('events/stage')
  async handleStageEvent(@Body() payload: any) {
    await this.missionsService.recordEvent(payload.mission_id, payload.stage, payload);
    return {
      success: true,
      mission_id: payload.mission_id,
      stage: payload.stage,
      status: payload.status,
    };
  }

  @Post('events/landing')
  async handleLanding(@Body() payload: any) {
    await this.missionsService.recordEvent(payload.mission_id, 'landing', payload);
    return {
      success: true,
      mission_id: payload.mission_id,
      status: 'landing',
    };
  }

  @Post('events/landed')
  async handleLanded(@Body() payload: any) {
    await this.missionsService.recordEvent(payload.mission_id, 'landed', payload);
    return {
      success: true,
      mission_id: payload.mission_id,
      status: 'landed',
    };
  }

  @Post('events/complete')
  async handleComplete(@Body() payload: any) {
    await this.missionsService.recordEvent(payload.mission_id, 'completed', payload);
    return {
      success: true,
      mission_id: payload.mission_id,
      status: 'completed',
      frames_received: payload.statistics?.frames_captured || 0,
    };
  }

  // ----------------------------------------------------
  // 3. TELEMETRY INGESTION & QUERY
  // ----------------------------------------------------
  @Post('telemetry')
  ingestTelemetry(@Body() telemetry: any) {
    return this.missionsService.recordTelemetry(telemetry);
  }

  @Get(':id/telemetry')
  getTelemetry(@Param('id') id: string) {
    return this.missionsService.getLatestTelemetry(id) || { status: 'idle', message: 'No live telemetry' };
  }

  // ----------------------------------------------------
  // 4. FRAMES INGESTION & QUERY
  // ----------------------------------------------------
  @Post('frames')
  async ingestFrame(@Body() frame: any) {
    return this.missionsService.recordFrame(frame);
  }

  @Get(':id/frames')
  async getFrames(@Param('id') id: string, @Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 250;
    const frames = await this.missionsService.getFrames(id, parsedLimit);
    return {
      mission_id: id,
      total_frames: frames.length,
      frames: frames,
    };
  }

  // ----------------------------------------------------
  // 5. MISSION METADATA & LIST
  // ----------------------------------------------------
  @Get(':id')
  getMission(@Param('id') id: string) {
    return this.missionsService.getMission(id);
  }

  @Get()
  listMissions() {
    return this.missionsService.listMissions();
  }
}
