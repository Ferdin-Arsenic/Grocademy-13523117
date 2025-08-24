import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterUserDto } from './dto/register-user.dto';
import * as bcrypt from 'bcrypt';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwtService: JwtService) {}

  async register(registerUserDto: RegisterUserDto) {
    const hashedPassword = await bcrypt.hash(registerUserDto.password, 10);
    try {
      const { firstName, lastName, email, username } = registerUserDto;
      const user = await this.prisma.user.create({
        data: {
          firstName,
          lastName,
          email,
          username,
          password: hashedPassword,
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Username or email already exists');
      }
      throw error;
    }
  }

  async login(loginUserDto: LoginUserDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: loginUserDto.identifier },
          { username: loginUserDto.identifier },
        ],
      },
    });

    if (!user || !(await bcrypt.compare(loginUserDto.password, user.password))) {
      throw new UnauthorizedException('Invalid identifier or password');
    }
    const payload = { sub: user.id, username: user.username, role: user.role };
    const token = await this.jwtService.signAsync(payload);

    return {
      status: "success",
      message: "Login successful",
      data: {
        username: user.username,
        token: token
      }
    };
  }
}