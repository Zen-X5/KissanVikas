import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MissionsController } from './missions.controller';
import { MissionsService } from './missions.service';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { DigitalTwinModule } from '../digital-twin/digital-twin.module';
import { Mission, MissionSchema } from '../schemas/mission.schema';
import { SurveyFrame, SurveyFrameSchema } from '../schemas/survey-frame.schema';
import { TelemetryLog, TelemetryLogSchema } from '../schemas/telemetry-log.schema';
import { MissionEvent, MissionEventSchema } from '../schemas/mission-event.schema';

@Module({
  imports: [
    CloudinaryModule,
    DigitalTwinModule,
    MongooseModule.forFeature([
      { name: Mission.name, schema: MissionSchema },
      { name: SurveyFrame.name, schema: SurveyFrameSchema },
      { name: TelemetryLog.name, schema: TelemetryLogSchema },
      { name: MissionEvent.name, schema: MissionEventSchema },
    ]),
  ],
  controllers: [MissionsController],
  providers: [MissionsService],
  exports: [MissionsService],
})
export class MissionsModule {}
