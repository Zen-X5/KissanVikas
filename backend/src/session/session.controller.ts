import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import type { Response, Request } from 'express';

import { SessionService } from './session.service';
import { AuthGuard } from './guards/auth.guard';

@Controller('api/v1/auth')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: { email: string; password: string },
    @Headers('user-agent') userAgent: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.sessionService.login(
      body.email,
      body.password,
      userAgent || 'web',
    );

    // Set cookie for frontend web-app
    res.cookie('kissan_token', result.accessToken, {
      httpOnly: false, // Accessible to client-side session.utils.ts
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return {
      success: true,
      message: 'Login successful',
      data: result,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token =
      req.headers.authorization?.split(' ')[1] ||
      req.cookies?.['kissan_token'];

    if (token) {
      await this.sessionService.logout(token);
    }

    res.clearCookie('kissan_token');
    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async getProfile(@Req() req: any) {
    return {
      success: true,
      data: req.user,
    };
  }
}
