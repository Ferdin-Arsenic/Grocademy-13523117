// backend/src/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  async register(registerUserDto: RegisterUserDto) {
    // Anda sudah bisa menulis bagian ini!
    const hashedPassword = await bcrypt.hash(registerUserDto.password, 10);

    // Bagian ini belum bisa dijalankan, jadi kita beri komentar dulu
    // const newUser = await prisma.user.create({
    //   data: {
    //     ...registerUserDto,
    //     password: hashedPassword,
    //   },
    // });

    // Kita kembalikan data tiruan dulu untuk sekarang
    console.log('Password asli:', registerUserDto.password);
    console.log('Password yang di-hash:', hashedPassword);
    return { message: 'User would be registered here.' };
  }
}