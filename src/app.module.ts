import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { EventModule } from './events/event.module';
import { TicketModule } from './ticket/tickets.module';
import { TaxesModule } from './taxes/taxes.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get('DB_HOST'),
        port: +config.get<number>('DB_PORT', 3306),
        username: config.get('DB_USER'),
        password: config.get('DB_PASS'),
        database: config.get('DB_NAME'),
        entities: [__dirname + '/entities/*.entity{.ts,.js}'],
        synchronize: true,
      }),
    }),
    AuthModule,
    EventModule,
    TicketModule,
    TaxesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
