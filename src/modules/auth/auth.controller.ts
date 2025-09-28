import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @ApiOperation({ summary: 'Register qilish !?' })
  @Post('register')
  register(@Body() payload: RegisterDto) {
    return this.authService.register(payload)
  }

  @ApiOperation({ summary: 'Login qilish !?' })
  @Post('login')
  login(@Body() payload: LoginDto) {
    return this.authService.login(payload)
  }
}
