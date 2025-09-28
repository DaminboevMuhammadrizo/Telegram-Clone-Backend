import { BadRequestException, Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AuthGuard } from 'src/core/guards/jwt-auth.guard';
import { v4 as uuidv4 } from 'uuid';
import { CreateMessageDto } from './dto/create.message.dto';
import { MessageService } from './message.service';


@Controller('message')
export class MessageController {
  constructor(private readonly messageService: MessageService) { }


  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Bita chatga oid hamma habarlarni olish !' })
  @ApiBearerAuth()
  @Get('all/:chatId')
  getAll(@Param('chatId', ParseIntPipe) chatId: number, @Req() req) {
    return this.messageService.getAll(chatId, req['user'].id)
  }


  @UseGuards(AuthGuard)
  @ApiBody({
    description: 'Habar ma\'lumotlari va fayl',
    schema: {
      type: 'object',
      properties: {
        messageType: {
          type: 'string',
          enum: ['text', 'audio', 'video', 'img', 'document']
        },
        message: { type: 'string' },
        chatId: { type: 'integer' },
        file: { type: 'string', format: 'binary' }
      },
      required: ['messageType', 'message', 'chatId']
    }
  })
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'yangi habar jonatish !' })
  @ApiBearerAuth()
  @Post('create')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, callback) => {
          const messageType = req.body.messageType;
          let uploadPath = '';

          switch (messageType) {
            case 'audio':
              uploadPath = './uploads/message/audio';
              break;
            case 'video':
              uploadPath = './uploads/message/video';
              break;
            case 'img':
              uploadPath = './uploads/message/img';
              break;
            case 'document':
              uploadPath = './uploads/message/document';
              break;
            default:
              uploadPath = './uploads/message/other';
          }

          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }

          callback(null, uploadPath);
        },
        filename: (req, file, callback) => {
          const fileExtName = extname(file.originalname);
          const fileName = `${uuidv4()}-${file.originalname}`;
          callback(null, fileName);
        },
      }),
      fileFilter: (req, file, callback) => {
        const messageType = req.body.messageType;

        const imageTypes = [
          'image/jpeg',      // .jpg, .jpeg
          'image/png',       // .png
          'image/gif',       // .gif
          'image/webp',      // .webp
          'image/bmp',       // .bmp
          'image/svg+xml',   // .svg
          'image/tiff',      // .tif, .tiff
          'image/x-icon',    // .ico
        ];

        const videoTypes = [
          'video/mp4',         // .mp4
          'video/mpeg',        // .mpeg, .mpg
          'video/x-msvideo',   // .avi
          'video/x-matroska',  // .mkv
          'video/webm',        // .webm
          'video/3gpp',        // .3gp
          'video/3gpp2',       // .3g2
          'video/ogg',         // .ogv
          'video/quicktime',   // .mov
          'video/x-flv',       // .flv
          'video/x-ms-wmv'     // .wmv
        ];

        const audioTypes = [
          'audio/mpeg',      // .mp3
          'audio/wav',       // .wav
          'audio/ogg',       // .ogg
          'audio/mp4',       // .m4a
          'audio/aac',       // .aac
          'audio/flac',      // .flac
          'audio/x-ms-wma'   // .wma
        ];

        const documentTypes = [
          'application/pdf',                    // .pdf
          'application/msword',                 // .doc
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
          'text/plain',                         // .txt
          'application/vnd.ms-excel',           // .xls
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
          'application/vnd.ms-powerpoint',      // .ppt
          'application/vnd.openxmlformats-officedocument.presentationml.presentation' // .pptx
        ];

        // File type validation
        switch (messageType) {
          case 'audio':
            if (!audioTypes.includes(file.mimetype)) {
              return callback(new BadRequestException('Audio uchun yaroqsiz fayl turi yuklandi!'), false);
            }
            break;
          case 'video':
            if (!videoTypes.includes(file.mimetype)) {
              return callback(new BadRequestException('Video uchun yaroqsiz fayl turi yuklandi!'), false);
            }
            break;
          case 'img':
            if (!imageTypes.includes(file.mimetype)) {
              return callback(new BadRequestException('Rasm uchun yaroqsiz fayl turi yuklandi!'), false);
            }
            break;
          case 'document':
            if (!documentTypes.includes(file.mimetype)) {
              return callback(new BadRequestException('Document uchun yaroqsiz fayl turi yuklandi!'), false);
            }
            break;
        }

        callback(null, true);
      },
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit
      },
    }),
  )
  create(
    @Body() payload: CreateMessageDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req,
  ) {
    if (payload.messageType !== 'text' && !file) {
      throw new BadRequestException('Bu message type uchun fayl majburiy!');
    }

    return this.messageService.create(
      payload,
      req['user'].id,
      file?.filename
    );
  }


  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Habarni ochirish !' })
  @ApiBearerAuth()
  @Delete('delete/:id')
  update(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.messageService.delete(id, req['user'].id)
  }
}
