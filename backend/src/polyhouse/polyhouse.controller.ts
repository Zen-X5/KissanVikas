import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PolyhouseService } from './polyhouse.service';

@Controller('api/v1/polyhouses')
export class PolyhouseController {
  constructor(private readonly polyhouseService: PolyhouseService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createPolyhouse(
    @Body()
    body: {
      userId: string;
      name: string;
      location: { latitude: number; longitude: number };
      dimensions?: { lengthM?: number; widthM?: number; heightM?: number };
      status?: string;
    },
  ) {
    const polyhouse = await this.polyhouseService.createPolyhouse(body);
    return {
      success: true,
      message: 'Polyhouse registered successfully',
      data: polyhouse,
    };
  }

  @Get()
  async listPolyhouses(@Query('userId') userId?: string) {
    const polyhouses = await this.polyhouseService.findAll(userId);
    return {
      success: true,
      data: polyhouses,
    };
  }

  @Get(':id')
  async getPolyhouseById(@Param('id') id: string) {
    const polyhouse = await this.polyhouseService.findById(id);
    return {
      success: true,
      data: polyhouse,
    };
  }
}
