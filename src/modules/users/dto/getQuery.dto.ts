import { ApiPropertyOptional } from "@nestjs/swagger"
import { IsInt, IsOptional, IsString } from "class-validator"

export class GetAllQueryDto {

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  limit: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  offset: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  username: string
}
