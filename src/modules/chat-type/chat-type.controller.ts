import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from 'src/core/guards/jwt-auth.guard';
import { ChatTypeService } from './chat-type.service';
import { CreateChatTypeDto } from './dto/create.dto';

@Controller('chat-type')
export class ChatTypeController {
  constructor(private readonly chatTypeService: ChatTypeService) { }


  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Hamma Folderni olish !?' })
  @Get('all')
  getAll() {
    return this.chatTypeService.getAll()
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Yangi Folder qoshish !?' })
  @Post('create')
  create(@Body() payload: CreateChatTypeDto) {
    return this.chatTypeService.create(payload)
  }


  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Folderni yangilash !?' })
  @Put('update/:id')
  update(@Body() payload: CreateChatTypeDto, @Param('id', ParseIntPipe) id: number) {
    return this.chatTypeService.update(id, payload)
  }


  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Folderni ochirib yuborish !?' })
  @Delete('delete/:id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.chatTypeService.delete(id)
  }
}
