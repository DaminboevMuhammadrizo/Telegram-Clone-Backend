import { Module } from '@nestjs/common';
import { ChatUserController } from './chat-user.controller';
import { ChatUserService } from './chat-user.service';

@Module({
  controllers: [ChatUserController],
  providers: [ChatUserService]
})
export class ChatUserModule {}
