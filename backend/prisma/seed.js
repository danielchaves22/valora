// backend/prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function main() {
  try {
    console.log('🌱 Iniciando seed...');

    await prisma.$connect();
    console.log('✅ Conexão com banco estabelecida');

    const existingCompany = await prisma.company.findUnique({
      where: { code: 0 }
    });

    if (existingCompany) {
      console.log('⚠️  Empresa Equinox já existe, pulando criação');

      const existingAdmin = await prisma.user.findUnique({
        where: { email: 'admin@equinox.com.br' }
      });

      if (existingAdmin) {
        console.log('⚠️  Usuário admin já existe, seed finalizado');
        return;
      }
    }

    const company = existingCompany || await prisma.company.create({
      data: {
        name: 'Equinox',
        address: 'Endereço Padrão',
        code: 0
      }
    });
    console.log('✅ Empresa Equinox criada:', { id: company.id, name: company.name, code: company.code });

    const hashedPassword = await bcrypt.hash('@dmin05c10', 10);
    console.log('🔐 Senha hasheada gerada');

    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@equinox.com.br',
        password: hashedPassword,
        name: 'Admin',
        role: 'ADMIN',
        mustChangePassword: false
      }
    });
    console.log('✅ Usuário admin criado:', { id: adminUser.id, email: adminUser.email, role: adminUser.role });

    const userCompany = await prisma.userCompany.create({
      data: {
        userId: adminUser.id,
        companyId: company.id,
        isDefault: true,
        role: 'ADMIN'
      }
    });
    console.log('✅ Associação admin/Equinox criada:', { userId: userCompany.userId, companyId: userCompany.companyId });

    console.log('🎉 Seed completado com sucesso!');
    console.log('📧 Você pode fazer login com: admin@equinox.com.br / @dmin05c10');

  } catch (error) {
    console.error('❌ Erro detalhado no seed:', error);
    if (error.message) {
      console.error('❌ Mensagem do erro:', error.message);
    }
    if (error.stack) {
      console.error('❌ Stack trace:', error.stack);
    }
    throw error;
  }
}

main()
  .catch((error) => {
    console.error('❌ Seed falhou:', error);
    process.exit(1);
  })
  .finally(async () => {
    console.log('🔌 Desconectando do banco...');
    await prisma.$disconnect();
    console.log('✅ Desconectado');
  });
