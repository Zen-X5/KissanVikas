import { Injectable, ConflictException, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument, UserRole } from './schemas/user.schema';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  async validatePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async findUserByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase().trim() }).exec();
  }

  async findUserById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async createCustomer(data: {
    name: string;
    email: string;
    password?: string;
    phone?: string;
    role?: string;
  }): Promise<UserDocument> {
    const existing = await this.findUserByEmail(data.email);
    if (existing) {
      throw new ConflictException(`User with email ${data.email} already exists`);
    }

    const rawPassword = data.password || 'Kissan@1234';
    const passwordHash = await this.hashPassword(rawPassword);

    const user = await this.userModel.create({
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      passwordHash,
      phone: data.phone?.trim() || '',
      role: data.role || UserRole.CUSTOMER,
      status: 'active',
    });

    this.logger.log(`Created new customer user: ${user.email} (${user._id})`);
    return user;
  }

  async findAllCustomers(): Promise<UserDocument[]> {
    return this.userModel.find({ role: UserRole.CUSTOMER }).select('-passwordHash').exec();
  }

  async findAllUsers(): Promise<UserDocument[]> {
    return this.userModel.find().select('-passwordHash').exec();
  }
}
