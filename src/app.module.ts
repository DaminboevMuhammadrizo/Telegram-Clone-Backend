import { Module } from '@nestjs/common';
import { PrismaModule } from './Database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ChatTypeModule } from './modules/chat-type/chat-type.module';
import { ChatUserModule } from './modules/chat-user/chat-user.module';
import { ChatsModule } from './modules/chats/chats.module';
import { MessageModule } from './modules/message/message.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [AuthModule, UsersModule, ChatsModule, ChatTypeModule, ChatUserModule, MessageModule, PrismaModule]
})
export class AppModule { }
