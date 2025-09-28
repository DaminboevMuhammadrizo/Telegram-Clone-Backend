import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { unlink } from 'fs/promises';
import { hashPassword } from 'src/common/config/bcrypt/hash';
import { PrismaService } from 'src/Database/prisma.service';
import { GetAllQueryDto } from './dto/getQuery.dto';
import { UpdateUserDto } from './dto/update.dto';


@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) { }


  async getAllusers() {
    const data = await this.prisma.user.findMany()

    if (data.length === 0) {
      throw new NotFoundException({ success: false, message: 'Users not found !' })
    }
    return { success: true, message: 'success', data }
  }

  async getAll(chatId: number, query: GetAllQueryDto) {
    const take = query.limit ?? 10;
    const skip = query.offset ? (query.offset - 1) * take : 0;
    const where: any = {};

    query.username && ({ contains: query.username, mode: 'insensitive' })

    const data = await this.prisma.user.findMany({
      where: {
        chats: {
          some: {
            chatId: chatId
          }
        },
        username: query.username ? {
          contains: query.username,
          mode: 'insensitive',
        } : undefined,
      },
      skip,
      take,
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        profileImg: true,
        birthDate: true,
      },
    });


    if (data.length === 0) {
      throw new NotFoundException({ success: false, message: 'Users not found !' })
    }

    return { success: true, message: 'success', data }
  }


  async getOne(id: number) {
    const data = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        profileImg: true,
        birthDate: true
      }
    })

    if (!data) {
      throw new NotFoundException({ success: false, message: 'User not found !' })
    }

    return { success: true, message: 'success', data }
  }


  async update(id: number, payload: UpdateUserDto) {

    const user = await this.prisma.user.findUnique({ where: { id } })
    if (!user) {
      throw new NotFoundException({ success: false, message: 'User not found !' })
    }

    if (payload.username) {
      const exsistsUsername = await this.prisma.user.findUnique({ where: { username: payload.username } })
      if (exsistsUsername) {
        throw new ConflictException({ success: false, message: 'This username alredye exsts !' })
      }
    }

    if (payload.password) {
      payload.password = await hashPassword(payload.password)
    }

    if (payload.profileImg && user.profileImg && payload.profileImg !== user.profileImg) {
      try {
        await unlink(`./uploads/profile-imgs/${user.profileImg}`);
      } catch (error) {
        console.error('Eski profil rasmni ochirishda xatolik:', error.message);
      }
    }

    await this.prisma.user.update({ where: { id }, data: payload })
    return { success: true, message: 'User success updated !' }
  }

}
