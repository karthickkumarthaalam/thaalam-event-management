import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

interface JwtPayload {
  sub: number;
  tenant_id: number;
  email?: string;
}

interface AuthUser {
  id: string;
  email: string;
  name: string;
  tenantName: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    const user = await this.userRepo.findOne({
      where: {
        id: String(payload.sub),
        tenant: { id: String(payload.tenant_id) },
      },
      relations: ['tenant'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found or tenant mismatch');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      tenantName: user.tenant.name,
    };
  }
}
