import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtAccsesToken } from 'src/common/config/jwt/jwt';
import { PrismaModule } from 'src/Database/prisma.module';
import { ChatTypeController } from './chat-type.controller';
import { ChatTypeService } from './chat-type.service';

@Module({
  imports: [PrismaModule, JwtModule.register(JwtAccsesToken)],
  controllers: [ChatTypeController],
  providers: [ChatTypeService]
})
export class ChatTypeModule { }
