import { BadRequestException, Body, Controller, Get, Param, ParseIntPipe, Put, Query, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AuthGuard } from 'src/core/guards/jwt-auth.guard';
import { v4 as uuidv4 } from 'uuid';
import { GetAllQueryDto } from './dto/getQuery.dto';
import { UpdateUserDto } from './dto/update.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) { }



  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Hamma userni olish' })
  @ApiBearerAuth()
  @Get('all')
  getAllUsers() {
    return this.userService.getAllusers()
  }


  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Bita chatga oid hamma userni olish' })
  @ApiBearerAuth()
  @Get('all/chats/:chatId')
  getAll(@Query() query: GetAllQueryDto, @Param('chatId', ParseIntPipe) chatId: number) {
    return this.userService.getAll(chatId, query)
  }


  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Profileni korish !?' })
  @ApiBearerAuth()
  @Get('profile')
  getOne(@Req() req: Request) {
    return this.userService.getOne(req['user'].id)
  }


  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Foydalanuvchi profilini yangilash !?' })
  @ApiConsumes('multipart/form-data')
  @Put('update')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        username: { type: 'string' },
        password: { type: 'string' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        profileImg: { type: 'string', format: 'binary' },
      },
      required: [],
    },
  })
  @UseInterceptors(
    FileInterceptor('profileImg', {
      storage: diskStorage({
        destination: './uploads/profile-imgs',
        filename: (req, file, cb) => {
          const uniqueName = uuidv4() + extname(file.originalname);
          cb(null, uniqueName);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'image/bmp',
          'image/svg+xml',
        ];
        if (!allowedMimeTypes.includes(file.mimetype)) {
          return cb(new BadRequestException('Faqat rasm fayllariga ruxsat berilgan!'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  async update(
    @UploadedFile() profileImg: Express.Multer.File,
    @Body() payload: UpdateUserDto,
    @Req() req: Request,
  ) {
    profileImg && (payload.profileImg = profileImg.filename)
    return this.userService.update(req['user'].id, payload);
  }
}
