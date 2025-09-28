import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from 'src/core/guards/jwt-auth.guard';
import { ChatsService } from './chats.service';
import { CreateChatDto } from './dto/create.chat.dto';
import { UpdateChatDto } from './dto/update.chat.dto';

@Controller('chats')
export class ChatsController {
  constructor(private readonly chatService: ChatsService) { }


  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Bita foydalanuchiga tegishli hamma chatni olish !' })
  @ApiBearerAuth()
  @Get('all')
  getAll(@Req() req: Request) {
    return this.chatService.getAll(req['user'].id)
  }

  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Yangi chat qoshish !' })
  @ApiBearerAuth()
  @Post('create')
  create(@Body() payload: CreateChatDto, @Req() req: Request) {
    return this.chatService.create(payload, req['user'].id)
  }

  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Chatni ozgartish !' })
  @ApiBearerAuth()
  @Put('update/:id')
  update(@Param('id', ParseIntPipe) id: number, @Body() payload: UpdateChatDto) {
    return this.chatService.update(id, payload)
  }

  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Bita foydalanuchiga tegishli hamma chatni olish' })
  @ApiBearerAuth()
  @Delete('delete/:id')
  delete(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.chatService.delete(id, req['user'].id)
  }
}
