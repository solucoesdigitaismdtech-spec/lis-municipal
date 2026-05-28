import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  // Exporta o UsersService para o AuthModule usar
  exports: [UsersService],
})
export class UsersModule {}
