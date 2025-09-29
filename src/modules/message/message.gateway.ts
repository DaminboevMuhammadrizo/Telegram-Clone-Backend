import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessageType } from 'src/common/types/types';
import { PrismaService } from 'src/Database/prisma.service';
import { MessageService } from './message.service';

interface AuthenticatedSocket extends Socket {
  userId?: number;
  username?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*'
  }
})
@Injectable()
export class MessageGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger = new Logger(MessageGateway.name);
  private activeUsers = new Map<number, string>();

  constructor(
    private readonly messageService: MessageService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) { }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // this.logger.log(`Client connecting: ${client.id}`);
      // console.log('HANDSHAKE', client.handshake)
      const token = client.handshake.auth.token || client.handshake.query.token;

      if (!token) {
        // this.logger.warn(`Client ${client.id} disconnected: No token provided`);
        client.disconnect();
        return;
      }

      const user = await this.validateToken(token as string);

      if (!user) {
        // this.logger.warn(`Client ${client.id} disconnected: Invalid token`);
        client.disconnect();
        return;
      }

      // console.log(client)
      client.userId = user.id;
      client.username = user.username;

      // console.log('info', client.userId, client.username)
      this.activeUsers.set(user.id, client.id);

      // console.log(`User ${user.username} (${user.id}) connected`);
      // console.log('Activeuser', this.activeUsers)

      // this.logger.log(`User ${user.username} (${user.id}) connected`);

      await this.joinUserChats(client, user.id);

      this.broadcastOnlineUsers();

    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.activeUsers.delete(client.userId);
      this.logger.log(`User ${client.username} (${client.userId}) disconnected`);
      this.broadcastOnlineUsers();
    }
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody() data: {
      messageType: MessageType;
      message: string;
      chatId: number;
      fileName?: string;
    },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      if (!client.userId) {
        client.emit('error', { message: 'Unauthorized' });
        return;
      }

      const result = await this.messageService.create(
        {
          messageType: data.messageType as any,
          message: data.message,
          chatId: data.chatId,
        },
        client.userId,
        data.fileName,
      );

      if (result.success) {
        const fullMessage = await this.prisma.message.findUnique({
          where: { id: result.data.id },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                profileImg: true,
              },
            },
          },
        });

        this.server.to(`chat_${data.chatId}`).emit('new_message', {
          success: true,
          data: fullMessage,
        });

        this.logger.log(`Message sent by ${client.username} to chat ${data.chatId}`);
      }

      client.emit('message_sent', result);
    } catch (error) {
      this.logger.error(`Send message error: ${error.message}`);
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('delete_message')
  async handleDeleteMessage(
    @MessageBody() data: { messageId: number },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      if (!client.userId) {
        client.emit('error', { message: 'Unauthorized' });
        return;
      }

      const message = await this.prisma.message.findUnique({
        where: { id: data.messageId },
        select: { chatId: true, senderId: true },
      });

      if (!message) {
        client.emit('error', { message: 'Message not found' });
        return;
      }

      const result = await this.messageService.delete(data.messageId, client.userId);

      if (result.success) {
        this.server.to(`chat_${message.chatId}`).emit('message_deleted', {
          success: true,
          messageId: data.messageId,
          deletedBy: client.userId,
        });

        this.logger.log(`Message ${data.messageId} deleted by ${client.username}`);
      }

      client.emit('message_delete_result', result);
    } catch (error) {
      this.logger.error(`Delete message error: ${error.message}`);
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('join_chat')
  async handleJoinChat(
    @MessageBody() data: { chatId: number },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      if (!client.userId) {
        client.emit('error', { message: 'Unauthorized' });
        return;
      }

      const isParticipant = await this.prisma.chatUser.findFirst({
        where: {
          chatId: data.chatId,
          userId: client.userId,
        },
      });

      if (!isParticipant) {
        client.emit('error', { message: 'You are not a member of this chat' });
        return;
      }

      await client.join(`chat_${data.chatId}`);
      client.emit('joined_chat', { chatId: data.chatId });

      client.to(`chat_${data.chatId}`).emit('user_joined', {
        userId: client.userId,
        username: client.username,
        chatId: data.chatId,
      });

      this.logger.log(`User ${client.username} joined chat ${data.chatId}`);
    } catch (error) {
      this.logger.error(`Join chat error: ${error.message}`);
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('leave_chat')
  async handleLeaveChat(
    @MessageBody() data: { chatId: number },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      await client.leave(`chat_${data.chatId}`);
      client.emit('left_chat', { chatId: data.chatId });

      client.to(`chat_${data.chatId}`).emit('user_left', {
        userId: client.userId,
        username: client.username,
        chatId: data.chatId,
      });

      this.logger.log(`User ${client.username} left chat ${data.chatId}`);
    } catch (error) {
      this.logger.error(`Leave chat error: ${error.message}`);
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('typing_start')
  handleTypingStart(
    @MessageBody() data: { chatId: number },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    client.to(`chat_${data.chatId}`).emit('user_typing', {
      userId: client.userId,
      username: client.username,
      chatId: data.chatId,
      typing: true,
    });
  }

  @SubscribeMessage('typing_stop')
  handleTypingStop(
    @MessageBody() data: { chatId: number },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    client.to(`chat_${data.chatId}`).emit('user_typing', {
      userId: client.userId,
      username: client.username,
      chatId: data.chatId,
      typing: false,
    });
  }

  private async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);

      const userId = payload.id;

      if (!userId) {
        this.logger.warn('Token is valid but userId (id) is missing');
        return null;
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
        },
      });

      return user;
    } catch (error) {
      this.logger.error(`Token validation error: ${error.message}`);
      return null;
    }
  }


  private async joinUserChats(client: AuthenticatedSocket, userId: number) {
    try {
      const userChats = await this.prisma.chatUser.findMany({
        where: { userId },
        include: { chat: true },
      });

      for (const userChat of userChats) {
        await client.join(`chat_${userChat.chatId}`);
      }

      // this.logger.log(`User ${userId} joined ${userChats.length} chats`);
    } catch (error) {
      this.logger.error(`Join user chats error: ${error.message}`);
    }
  }

  private broadcastOnlineUsers() {
    const onlineUserIds = Array.from(this.activeUsers.keys());
    this.server.emit('online_users', { userIds: onlineUserIds });
  }

  async notifyNewMessage(chatId: number, message: any) {
    this.server.to(`chat_${chatId}`).emit('new_message', {
      success: true,
      data: message,
    });
  }
}
