import { JwtSignOptions } from '@nestjs/jwt'

export const JwtAccsesToken: JwtSignOptions = {
  secret: 'salomqwerty',
  expiresIn: '10000d'
}

export const JwtRefreshToken: JwtSignOptions = {
  secret: 'salomqwerty',
  expiresIn: '300000d'
}
