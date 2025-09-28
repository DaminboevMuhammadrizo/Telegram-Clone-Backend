import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/Database/prisma.service';
import { CreateChatDto } from './dto/create.chat.dto';
import { UpdateChatDto } from './dto/update.chat.dto';

@Injectable()
export class ChatsService {
  constructor(private readonly prisma: PrismaService) { }

  async getAll(userId: number) {
    const data = await this.prisma.chat.findMany({
      where: {
        chatUser: {
          some: {
            userId: userId,
          },
        },
      },
    });

    if (data.length === 0) {
      throw new NotFoundException({ success: false, message: 'Chats not found !?' })
    }

    return { success: true, message: 'succcess', data };
  }


  async create(payload: CreateChatDto, creatorUserId: number) {
    const chatType = await this.prisma.chatType.findUnique({
      where: { id: payload.chatTypeId }
    });

    if (!chatType) {
      throw new NotFoundException({ success: false, message: 'ChatType not found!' });
    }

    const userIdsSet = new Set(payload.userIds);
    userIdsSet.add(creatorUserId);
    const allUserIds = Array.from(userIdsSet);

    const existingUsers = await this.prisma.user.findMany({
      where: {
        id: {
          in: allUserIds,
        },
      },
      select: { id: true },
    });

    const existingUserIds = new Set(existingUsers.map(u => u.id));

    const invalidUserIds = allUserIds.filter(id => !existingUserIds.has(id));

    if (invalidUserIds.length > 0) {
      throw new NotFoundException({
        success: false,
        message: `Quyidagi userId(lar) topilmadi: ${invalidUserIds.join(', ')}`,
      });
    }

    const chat = await this.prisma.chat.create({
      data: {
        name: payload.name,
        chatTypeId: payload.chatTypeId,
      },
    });

    const chatUserData = allUserIds.map(userId => ({
      chatId: chat.id,
      userId,
    }));

    await this.prisma.chatUser.createMany({
      data: chatUserData,
    });

    return {
      success: true,
      message: 'Chat successfully created!',
      chatId: chat.id,
    };
  }




  async update(id: number, payload: UpdateChatDto) {
    const existsChat = await this.prisma.chat.findUnique({ where: { id } })

    if (!existsChat) {
      throw new NotFoundException({ success: false, message: 'Chat not found !' })
    }

    if (payload.chatTypeId) {
      const chatType = await this.prisma.chatType.findUnique({ where: { id: payload.chatTypeId } })

      if (!chatType) {
        throw new NotFoundException({ success: false, message: 'ChatType not found !' })
      }
    }

    await this.prisma.chat.update({ where: { id }, data: payload })
    return { success: true, message: 'Chat success updated !' }
  }


  async delete(chatId: number, userId: number) {
    const chatUser = await this.prisma.chatUser.findFirst({
      where: {
        chatId: chatId,
        userId: userId,
      },
    });

    if (!chatUser) {
      throw new NotFoundException({ success: false, message: "Chat yoki Foydalanuvchi topilmadi !" });
    }

    await this.prisma.chat.delete({ where: { id: chatId, } });
    return { message: "Chat ochirildi !" };
  }


}
