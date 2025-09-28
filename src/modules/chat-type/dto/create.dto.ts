import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class CreateChatTypeDto {

  @ApiProperty()
  @IsString()
  name: string
}
