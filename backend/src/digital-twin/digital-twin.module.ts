import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DigitalTwinController } from './digital-twin.controller';
import { DigitalTwinService } from './digital-twin.service';
import { DigitalTwin, DigitalTwinSchema } from './schemas';





@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DigitalTwin.name, schema: DigitalTwinSchema },
    ]),
  ],
  controllers: [DigitalTwinController],
  providers: [DigitalTwinService],
  exports: [DigitalTwinService],
})
export class DigitalTwinModule {}
