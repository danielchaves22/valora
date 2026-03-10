// backend/src/services/company.service.ts - COM MÉTODO PARA LISTAR EMPRESAS DO USUÁRIO
import { PrismaClient, Company, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export default class CompanyService {
  static async nextCode(): Promise<number> {
    const agg = await prisma.company.aggregate({
      _max: { code: true }
    });
    const max = agg._max.code ?? -1;
    return max + 1;
  }

  /**
   * Cria empresa.
   */
  static async createCompany(data: {
    name: string;
    legalName?: string;
    address?: string;
  }): Promise<Company> {
    const { name, legalName, address } = data;

    logger.info('Creating new company', { name });

    const code = await this.nextCode();
    const company = await prisma.company.create({
      data: { name, legalName, address, code }
    });

    logger.info('Company created successfully', {
      companyId: company.id,
      name: company.name,
      code: company.code
    });

    return company;
  }

  /**
   * Lista todas as empresas (para ADMIN)
   */
  static async listCompanies(): Promise<Company[]> {
    return prisma.company.findMany({ 
      orderBy: { code: 'asc' } 
    });
  }

  /**
   * ✅ NOVO: Lista apenas as empresas às quais o usuário tem acesso (para SUPERUSER)
   */
  static async listUserCompanies(userId: number): Promise<Company[]> {
    const userCompanies = await prisma.company.findMany({
      where: {
        users: {
          some: {
            userId: userId
          }
        }
      },
      orderBy: { code: 'asc' }
    });

    return userCompanies;
  }

  static async updateCompany(
    id: number,
    data: Partial<Prisma.CompanyUpdateInput>
  ): Promise<Company> {
    return prisma.company.update({ where: { id }, data });
  }

  static async deleteCompany(id: number): Promise<void> {
    await prisma.company.delete({ where: { id } });
  }
}
