import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compirePassword } from 'src/common/config/bcrypt/compire';
import { hashPassword } from 'src/common/config/bcrypt/hash';
import { JwtPayload } from 'src/common/types/types';
import { PrismaService } from 'src/Database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) { }

  private async generateToken(payload: JwtPayload) {

    const accessToken = await this.jwtService.signAsync(payload)
    const refreshToken = await this.jwtService.signAsync({ id: payload.id })

    return { accessToken, refreshToken }
  }


  async register(payload: RegisterDto) {
    const existsUsername = await this.prisma.user.findUnique({ where: { username: payload.username } })

    if (existsUsername) {
      throw new ConflictException({ succes: false, message: 'this username alredy exists !?' })
    }

    const shifr = await hashPassword(payload.password)

    const user = await this.prisma.user.create({ data: { ...payload, password: shifr } })
    return this.generateToken({ id: user.id })
  }


  async login(payload: LoginDto) {
    const existsUsername = await this.prisma.user.findUnique({ where: { username: payload.username } })

    if (!existsUsername) {
      throw new BadRequestException({ succes: false, message: 'Invalide username or password !?' })
    }

    const deshif = await compirePassword(payload.password, existsUsername.password)

    if (!deshif) {
      throw new BadRequestException({ success: false, message: 'Invalide username or password !?' })
    }

    return this.generateToken({ id: existsUsername.id })
  }
}
