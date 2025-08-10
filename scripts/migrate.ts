import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import logger from '../src/utils/logger';

const prisma = new PrismaClient();

async function main() {
  try {
    logger.info('Starting database migration...');

    // Create default admin user
    const adminExists = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      await prisma.user.create({
        data: {
          email: 'admin@blog.com',
          username: 'admin',
          firstName: 'Admin',
          lastName: 'User',
          password: hashedPassword,
          role: 'ADMIN',
          bio: 'Blog administrator',
        },
      });

      logger.info('Default admin user created');
    }

    // Create default categories
    const categoriesExist = await prisma.category.count();
    
    if (categoriesExist === 0) {
      const defaultCategories = [
        {
          name: 'Teknoloji',
          slug: 'teknoloji',
          description: 'Teknoloji haberleri ve makaleleri',
          color: '#3b82f6',
          icon: 'laptop',
          sortOrder: 1,
        },
        {
          name: 'Tasarım',
          slug: 'tasarim',
          description: 'UI/UX tasarım konuları',
          color: '#8b5cf6',
          icon: 'palette',
          sortOrder: 2,
        },
        {
          name: 'Programlama',
          slug: 'programlama',
          description: 'Programlama dilleri ve framework\'ler',
          color: '#10b981',
          icon: 'code',
          sortOrder: 3,
        },
        {
          name: 'Genel',
          slug: 'genel',
          description: 'Genel konular',
          color: '#6b7280',
          icon: 'chat',
          sortOrder: 4,
        },
      ];

      await prisma.category.createMany({
        data: defaultCategories,
      });

      logger.info('Default categories created');
    }

    logger.info('Database migration completed successfully');
  } catch (error) {
    logger.error('Database migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { main as migrate };