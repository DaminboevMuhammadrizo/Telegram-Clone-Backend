import { ApiPropertyOptional } from "@nestjs/swagger"
import { IsOptional, IsString } from "class-validator"

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  username?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  password?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  firstName?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  lastName?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  profileImg?: string
}
