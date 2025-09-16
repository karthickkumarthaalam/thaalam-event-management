import { Injectable, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Tenant } from 'src/entities/tenant.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Tenant) private readonly tenantRepo: Repository<Tenant>,
  ) {}

  async createUser(
    email: string,
    password: string,
    tenantName: string,
    name: string,
    phone: string,
  ): Promise<User> {
    const tenant = await this.tenantRepo.findOne({
      where: { name: tenantName },
    });
    if (!tenant)
      throw new BadRequestException(`Tenant "${tenantName}" does not exist`);

    const existing = await this.userRepo.findOne({
      where: [
        { email, tenant: { id: tenant.id } },
        { phone, tenant: { id: tenant.id } },
      ],
      relations: ['tenant'],
    });

    if (existing)
      throw new BadRequestException('User already exists for this tenant');

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.userRepo.create({
      email,
      password: hashedPassword,
      tenant,
      name,
      phone,
      isEmailVerified: false,
    });

    return this.userRepo.save(user);
  }

  async markEmailVerified(user: User) {
    user.isEmailVerified = true;
    return this.userRepo.save(user);
  }

  async findById(userId: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { id: userId },
      relations: ['tenant'],
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email }, relations: ['tenant'] });
  }

  async updatePassword(user: User, newPassword: string) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    return this.userRepo.save(user);
  }
}
