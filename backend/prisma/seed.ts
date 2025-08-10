import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('adminpassword', 10); // Ganti dengan password yang aman

  // Hapus admin lama jika ada, untuk menghindari duplikat
  await prisma.user.deleteMany({ where: { role: 'admin' } });

  // Buat user admin baru
  const admin = await prisma.user.create({
    data: {
      email: 'admin@grocademy.com',
      username: 'admin',
      firstName: 'Admin',
      lastName: 'Grocademy',
      password: hashedPassword,
      role: 'admin', // <-- Kunci penting untuk membedakan admin
    },
  });

  console.log({ admin });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });