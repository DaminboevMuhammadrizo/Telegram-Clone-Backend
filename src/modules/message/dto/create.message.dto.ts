import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsInt, IsString } from "class-validator";
import { MessageType } from "src/common/types/types";

export class CreateMessageDto {
  @ApiProperty({
    enum: MessageType,
    enumName: 'MessageType',
    description: 'Habar turi',
    example: MessageType.text
  })
  @IsEnum(MessageType)
  messageType: MessageType

  @ApiProperty({ description: 'Habar matni' })
  @IsString()
  message: string

  @ApiProperty({ description: 'Chat ID' })
  @IsInt()
  chatId: number
}
