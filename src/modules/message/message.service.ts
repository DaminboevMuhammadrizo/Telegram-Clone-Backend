import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { existsSync } from 'fs';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { PrismaService } from 'src/Database/prisma.service';
import { CreateMessageDto } from './dto/create.message.dto';

@Injectable()
export class MessageService {
  constructor(private readonly prisma: PrismaService) { }

  async getAll(chatId: number, userId: number) {
    const isParticipant = await this.prisma.chatUser.findFirst({
      where: {
        chatId,
        userId,
      },
    });

    if (!isParticipant) {
      throw new ForbiddenException({ success: false, message: 'User is not part of this chat.' });
    }

    const data = await this.prisma.message.findMany({
      where: { chatId },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            profileImg: true,
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    return { success: true, message: 'success', data };
  }

  async create(payload: CreateMessageDto, senderId: number, fileName?: string) {
    const sender = await this.prisma.user.findUnique({ where: { id: senderId } });

    if (!sender) {
      throw new NotFoundException({ success: false, message: 'Sender not found!' });
    }

    const chat = await this.prisma.chat.findUnique({ where: { id: payload.chatId } });
    if (!chat) {
      throw new NotFoundException({ success: false, message: 'Chat not found!' });
    }

    const isParticipant = await this.prisma.chatUser.findFirst({
      where: { chatId: payload.chatId, userId: senderId }
    });

    if (!isParticipant) {
      throw new ForbiddenException({ success: false, message: 'You are not a member of this chat!' });
    }

    const hasTextMessage = payload.message && payload.message.trim().length > 0;
    const hasFile = fileName && fileName.trim().length > 0;

    if (!hasTextMessage && !hasFile) {
      throw new BadRequestException({
        success: false,
        message: 'Message must contain either text content or a file!'
      });
    }

    if (payload.messageType === 'text' && hasFile) {
      throw new BadRequestException({
        success: false,
        message: 'Text message type cannot have files!'
      });
    }

    if (payload.messageType !== 'text' && !hasFile) {
      throw new BadRequestException({
        success: false,
        message: `${payload.messageType} message type requires a file!`
      });
    }

    const messageData: any = {
      messageType: payload.messageType,
      message: payload.message || '',
      chatId: payload.chatId,
      senderId: senderId,
    };

    if (fileName) {
      switch (payload.messageType) {
        case 'audio':
          messageData.audioUrl = fileName;
          break;
        case 'video':
          messageData.videoUrl = fileName;
          break;
        case 'img':
          messageData.imageUrl = fileName;
          break;
        case 'document':
          messageData.documentUrl = fileName;
          break;
      }
    }

    const createdMessage = await this.prisma.message.create({
      data: messageData,
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            profileImg: true,
          }
        }
      }
    });

    return { success: true, message: 'Message successfully sent!', data: createdMessage };
  }

  async delete(id: number, userId: number) {
    const message = await this.prisma.message.findUnique({
      where: { id },
      include: {
        sender: true,
        chat: {
          include: {
            chatUser: {
              where: { userId }
            }
          }
        }
      }
    });

    if (!message) {
      throw new NotFoundException({ success: false, message: 'Message not found!' });
    }

    if (message.chat.chatUser.length === 0) {
      throw new ForbiddenException({ success: false, message: 'You are not a member of this chat!' });
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException({
        success: false,
        message: 'You can only delete your own messages!'
      });
    }

    try {
      const fileUrls = [
        { url: message.audioUrl, path: 'uploads/message/audio' },
        { url: message.videoUrl, path: 'uploads/message/video' },
        { url: message.imageUrl, path: 'uploads/message/img' },
        { url: message.documentUrl, path: 'uploads/message/document' }
      ];

      for (const fileInfo of fileUrls) {
        if (fileInfo.url) {
          const filePath = join(process.cwd(), fileInfo.path, fileInfo.url);

          if (existsSync(filePath)) {
            await unlink(filePath);
            console.log(`File deleted: ${filePath}`);
          }
        }
      }

      await this.prisma.message.delete({ where: { id } });

      return {
        success: true,
        message: 'Message and files deleted successfully!',
        deletedMessage: {
          id: message.id,
          chatId: message.chatId,
          senderId: message.senderId
        }
      };
    } catch (error) {
      throw new BadRequestException({
        success: false,
        message: 'Failed to delete message',
        error: error.message
      });
    }
  }

  async getMessageById(messageId: number, userId: number) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            profileImg: true,
          }
        },
        chat: {
          include: {
            chatUser: {
              where: { userId }
            }
          }
        }
      }
    });

    if (!message) {
      throw new NotFoundException({ success: false, message: 'Message not found!' });
    }

    if (message.chat.chatUser.length === 0) {
      throw new ForbiddenException({ success: false, message: 'You are not a member of this chat!' });
    }

    return { success: true, data: message };
  }

  async getChatParticipants(chatId: number) {
    const participants = await this.prisma.chatUser.findMany({
      where: { chatId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            profileImg: true,
          }
        }
      }
    });

    return participants.map(p => p.user);
  }
}
