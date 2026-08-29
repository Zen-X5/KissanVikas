import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PolyhouseService } from './polyhouse.service';
import { PolyhouseController } from './polyhouse.controller';
import { Polyhouse, PolyhouseSchema } from './schemas/polyhouse.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Polyhouse.name, schema: PolyhouseSchema }]),
  ],
  controllers: [PolyhouseController],
  providers: [PolyhouseService],
  exports: [PolyhouseService],
})
export class PolyhouseModule {}
