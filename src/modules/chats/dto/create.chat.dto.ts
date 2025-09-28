import { ApiProperty } from "@nestjs/swagger";
import { ArrayMinSize, IsArray, IsInt, IsString } from "class-validator";

export class CreateChatDto {

  @ApiProperty()
  @IsString()
  name: string

  @ApiProperty()
  @IsInt()
  chatTypeId: number

  @ApiProperty({ type: [Number] })
  @IsArray()
  @ArrayMinSize(1)
  userIds: number[]
}
