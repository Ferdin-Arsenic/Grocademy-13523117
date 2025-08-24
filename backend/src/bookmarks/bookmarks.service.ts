import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const BASE_URL = 'http://localhost:3000';

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

    // --- PERBAIKAN DI SINI ---
    // Ubah hasil untuk menambahkan URL lengkap dan hitung jumlah modul
    return bookmarks.map(bookmark => {
      let courseWithFullUrl = bookmark.course;
      
      // Terapkan transformasi URL gambar
      if (courseWithFullUrl.thumbnailImage && !courseWithFullUrl.thumbnailImage.startsWith('http')) {
        courseWithFullUrl = {
          ...courseWithFullUrl,
          thumbnailImage: `${BASE_URL}${courseWithFullUrl.thumbnailImage}`
        };
      }

      // Kembalikan format yang diharapkan oleh frontend
      return {
        ...courseWithFullUrl,
        modules: courseWithFullUrl.modules.length // Ubah `modules` menjadi `total_modules` jika perlu konsistensi
      };
    });
  }

  async toggleBookmark(userId: string, courseId: string) {
    // ... (sisa fungsi toggleBookmark tidak perlu diubah)
    const existingBookmark = await this.prisma.userCourseBookmark.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      }
    });

    if (existingBookmark) {
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