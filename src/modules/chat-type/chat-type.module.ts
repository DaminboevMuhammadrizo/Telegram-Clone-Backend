import { Module } from '@nestjs/common';
import { ChatTypeController } from './chat-type.controller';
import { ChatTypeService } from './chat-type.service';

@Module({
  controllers: [ChatTypeController],
  providers: [ChatTypeService]
})
export class ChatTypeModule {}
