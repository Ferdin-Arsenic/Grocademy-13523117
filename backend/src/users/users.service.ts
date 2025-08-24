import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { AddBalanceDto } from './dto/add-balance.dto';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const whereCondition: Prisma.UserWhereInput = query
      ? {
          OR: [
            { username: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
          ],
        }
      : {};

    const users = await this.prisma.user.findMany({
      where: whereCondition,
      skip: skip,
      take: limit,
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        balance: true,
        role: true,
      },
    });

    const totalItems = await this.prisma.user.count({ where: whereCondition });

    return {
      status: "success",
      message: "Users retrieved successfully",
      data: users.map(user => ({
          id: user.id,
          username: user.username,
          email: user.email,
          first_name: user.firstName,
          last_name: user.lastName,
          balance: user.balance
      })),
      pagination: {
        current_page: page,
        total_pages: Math.ceil(totalItems / limit),
        total_items: totalItems,
      },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        balance: true,
        role: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id); 
    if (user.role === 'admin') {
      throw new BadRequestException('Admin account cannot be modified');
    }

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  async remove(id: string) {
    const user = await this.findOne(id);
    if (user.role === 'admin') {
      throw new BadRequestException('Admin account cannot be deleted');
    }
    return this.prisma.user.delete({ where: { id } });
  }

  async addBalance(id: string, addBalanceDto: AddBalanceDto) {
    await this.findOne(id);
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        balance: {
          increment: addBalanceDto.increment,
        },
      },
      select: {
        id: true,
        username: true,
        balance: true,
      },
    });
    return {
        status: "success",
        message: "Balance added successfully",
        data: updatedUser
    }
  }
}