import { Controller, Get, Post, Param, Req, UseGuards } from '@nestjs/common';
import { BookmarksService } from './bookmarks.service';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import type { Request } from 'express';

@Controller('bookmarks')
@UseGuards(JwtAuthGuard) // Semua endpoint di sini butuh login
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Get()
  getUserBookmarks(@Req() req: Request) {
    const user = req.user as { id: string };
    return this.bookmarksService.getUserBookmarks(user.id);
  }

  @Post(':courseId')
  toggleBookmark(@Param('courseId') courseId: string, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.bookmarksService.toggleBookmark(user.id, courseId);
  }
}