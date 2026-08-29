import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Polyhouse, PolyhouseDocument } from './schemas/polyhouse.schema';

@Injectable()
export class PolyhouseService {
  private readonly logger = new Logger(PolyhouseService.name);

  constructor(
    @InjectModel(Polyhouse.name) private polyhouseModel: Model<PolyhouseDocument>,
  ) {}

  async createPolyhouse(data: {
    userId: string;
    name: string;
    location: { latitude: number; longitude: number };
    dimensions?: { lengthM?: number; widthM?: number; heightM?: number };
    status?: string;
  }): Promise<PolyhouseDocument> {
    const polyhouse = await this.polyhouseModel.create({
      userId: new mongoose.Types.ObjectId(data.userId),
      name: data.name.trim(),
      location: {
        latitude: data.location.latitude,
        longitude: data.location.longitude,
      },
      dimensions: {
        lengthM: data.dimensions?.lengthM ?? 60.0,
        widthM: data.dimensions?.widthM ?? 30.0,
        heightM: data.dimensions?.heightM ?? 6.5,
      },
      status: data.status || 'active',
      twinStatus: 'not_created',
    });

    this.logger.log(`Created polyhouse: "${polyhouse.name}" (${polyhouse._id}) for User: ${data.userId}`);
    return polyhouse;
  }

  async findAll(userId?: string): Promise<PolyhouseDocument[]> {
    const filter = userId ? { userId: new mongoose.Types.ObjectId(userId) } : {};
    return this.polyhouseModel.find(filter).populate('userId', 'name email').exec();
  }

  async findById(id: string): Promise<PolyhouseDocument | null> {
    return this.polyhouseModel.findById(id).populate('userId', 'name email').exec();
  }

  async updateTwinStatus(id: string, twinStatus: string): Promise<PolyhouseDocument | null> {
    return this.polyhouseModel.findByIdAndUpdate(
      id,
      { twinStatus },
      { returnDocument: 'after' },
    ).exec();
  }
}
