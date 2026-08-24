import { Controller, Get, Param } from '@nestjs/common';
import { DigitalTwinService } from './digital-twin.service';

@Controller('api/v1/digital-twin')
export class DigitalTwinController {
  constructor(private readonly digitalTwinService: DigitalTwinService) {}

  @Get()
  getDigitalTwin() {
    return this.digitalTwinService.getDigitalTwin();
  }

  @Get('heatmap')
  getHeatmap() {
    return this.digitalTwinService.getHeatmap();
  }

  @Get('beds/:bedId')
  getBed(@Param('bedId') bedId: string) {
    return this.digitalTwinService.getBed(bedId);
  }
}
