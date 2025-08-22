import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BookmarksService {
  constructor(private prisma: PrismaService) {}

  async getUserBookmarks(userId: string) {
    const bookmarks = await this.prisma.userCourseBookmark.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            modules: true
          }
        }
      },
      orderBy: { bookmarkedAt: 'desc' }
    });

    // Return courses with modules count
    return bookmarks.map(bookmark => ({
      ...bookmark.course,
      modules: bookmark.course.modules.length
    }));
  }

  async toggleBookmark(userId: string, courseId: string) {
    // Check if bookmark exists
    const existingBookmark = await this.prisma.userCourseBookmark.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      }
    });

    if (existingBookmark) {
      // Remove bookmark
      await this.prisma.userCourseBookmark.delete({
        where: {
          userId_courseId: {
            userId,
            courseId
          }
        }
      });
      return { message: 'Bookmark removed', bookmarked: false };
    } else {
      // Add bookmark
      await this.prisma.userCourseBookmark.create({
        data: {
          userId,
          courseId
        }
      });
      return { message: 'Bookmark added', bookmarked: true };
    }
  }
}