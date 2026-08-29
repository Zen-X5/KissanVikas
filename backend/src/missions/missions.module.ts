import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MissionsController } from './missions.controller';
import { MissionsService } from './missions.service';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { DigitalTwinModule } from '../digital-twin/digital-twin.module';
import {
  Mission,
  MissionSchema,
  SurveyFrame,
  SurveyFrameSchema,
  TelemetryLog,
  TelemetryLogSchema,
  MissionEvent,
  MissionEventSchema,
} from './schemas';


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
