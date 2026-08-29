import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('api/v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createCustomer(
    @Body()
    body: {
      name: string;
      email: string;
      password?: string;
      phone?: string;
      role?: string;
    },
  ) {
    const user = await this.usersService.createCustomer(body);
    return {
      success: true,
      message: 'Customer created successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
      },
    };
  }

  @Get()
  async listCustomers() {
    const customers = await this.usersService.findAllCustomers();
    return {
      success: true,
      data: customers,
    };
  }

  @Get(':id')
  async getCustomerById(@Param('id') id: string) {
    const user = await this.usersService.findUserById(id);
    return {
      success: true,
      data: user,
    };
  }
}
