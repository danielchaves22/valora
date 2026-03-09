// backend/src/routes/company.routes.ts
import { Router } from 'express';
import { authorize } from '../middlewares/authorize.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createCompany,
  listCompanies,
  updateCompany,
  deleteCompany
} from '../controllers/company.controller';
import {
  createCompanySchema,
  updateCompanySchema
} from '../validators/company.validator';

const router = Router();

// Criar empresa
router.post(
  '/',
  validate(createCompanySchema),
  authorize('create', 'company'),
  createCompany
);

// Listar empresas
router.get('/', authorize('read', 'company'), listCompanies);

// Atualizar empresa
router.put(
  '/:id',
  validate(updateCompanySchema),
  authorize('update', 'company'),
  updateCompany
);

// Excluir empresa
router.delete('/:id', authorize('delete', 'company'), deleteCompany);

export default router;
