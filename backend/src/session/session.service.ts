import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { Session, SessionDocument } from './schemas/session.schema';
import { UsersService } from '../users/users.service';
import { UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) { }

  async login(
    email: string,
    password: string,
    userAgent: string = 'web',
    ssoAgent: string = 'kissan-web',
  ): Promise<{ accessToken: string; user: { id: string; name: string; email: string; role: string } }> {
    const user = await this.usersService.findUserByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status === 'suspended') {
      throw new UnauthorizedException('Your account has been suspended. Contact administrator.');
    }

    const isValid = await this.usersService.validatePassword(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // JWT Payload containing strictly { id, name, role } for RBAC
    const payload = {
      id: user._id.toString(),
      name: user.name,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Store active session in MongoDB
    try {
      await this.sessionModel.create({
        user_id: user._id.toString(),
        access_token: accessToken,
        access_token_expires_at: expiresAt,
        refresh_token: '',
        user_agent: userAgent,
        sso_agent: ssoAgent,
      });
    } catch (err) {
      this.logger.warn(`Could not persist session to DB (fallback to stateless JWT): ${err.message}`);
    }

    this.logger.log(`User logged in successfully: ${user.email} (Role: ${user.role})`);

    return {
      accessToken,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async logout(accessToken: string): Promise<boolean> {
    try {
      await this.sessionModel.deleteMany({ access_token: accessToken }).exec();
      return true;
    } catch (err) {
      this.logger.error(`Error deleting session: ${err.message}`);
      return false;
    }
  }

  async getSession(token: string): Promise<SessionDocument | null> {
    return this.sessionModel.findOne({ access_token: token }).exec();
  }

  async getUserByToken(token: string): Promise<UserDocument | null> {
    try {
      const payload = await this.jwtService.verifyAsync(token);
      if (!payload || !payload.id) return null;
      return this.usersService.findUserById(payload.id);
    } catch {
      return null;
    }
  }
}
