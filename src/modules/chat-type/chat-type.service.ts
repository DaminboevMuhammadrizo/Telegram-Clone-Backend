import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/Database/prisma.service';
import { CreateChatTypeDto } from './dto/create.dto';
import { UpdateChatTypeDto } from './dto/update.dto';

@Injectable()
export class ChatTypeService {
  constructor(private readonly prisma: PrismaService) { }


  async getAll() {
    const data = await this.prisma.chatType.findMany()

    if (data.length === 0) {
      throw new NotFoundException({ success: false, message: 'Chat Type not found !?' })
    }

    return { success: true, message: 'success', data }
  }


  async create(payload: CreateChatTypeDto) {
    const existsChatType = await this.prisma.chatType.findUnique({ where: { name: payload.name } })

    if (existsChatType) {
      throw new ConflictException({ success: false, message: 'this ChatType name alredy exsits !?' })
    }

    await this.prisma.chatType.create({ data: payload })
    return { success: true, message: 'ChatType success creatd !?' }
  }


  async update(id: number, payload: UpdateChatTypeDto) {
    const chatType = await this.prisma.chatType.findUnique({ where: { id } })

    if (!chatType) {
      throw new NotFoundException({ success: false, message: 'ChatType not found !?' })
    }

    if (payload.name) {
      const existsChatType = await this.prisma.chatType.findUnique({ where: { name: payload.name } })

      if (existsChatType) {
        throw new ConflictException({ success: false, message: 'this ChatType name alredy exsits !?' })
      }
    }

    await this.prisma.chatType.update({ where: { id }, data: payload })
    return { success: true, message: 'ChatType success updated !?' }
  }


  async delete(id: number) {
    const chatType = await this.prisma.chatType.findUnique({ where: { id } })

    if (!chatType) {
      throw new NotFoundException({ success: false, message: 'ChatType not found !?' })
    }

    await this.prisma.chatType.delete({ where: { id } })
    return { success: true, message: 'chatType success deleted !?' }
  }
}
