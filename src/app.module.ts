import { Module } from '@nestjs/common';
import { UsersModule } from './modules/users/users.module';
import { ChatsModule } from './modules/chats/chats.module';
import { ChatTypeModule } from './modules/chat-type/chat-type.module';
import { ChatUserModule } from './modules/chat-user/chat-user.module';
import { MessageModule } from './modules/message/message.module';

@Module({
  imports: [UsersModule, ChatsModule, ChatTypeModule, ChatUserModule, MessageModule]
})
export class AppModule { }
