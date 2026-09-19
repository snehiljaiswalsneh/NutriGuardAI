import { adminRepository, AdminRepository } from '../repository/admin.repository.js';

export class AdminService {
  constructor(private readonly repository: AdminRepository = adminRepository) {}

  async getDashboardMetrics(fromDate?: Date) {
    return this.repository.getDashboardMetrics(fromDate);
  }

  async listUsers(query: string | undefined, page: number, limit: number) {
    const { rows, total } = await this.repository.listUsers(query, page, limit);
    return {
      items: rows.map((u) => ({
        id: u.id,
        full_name: u.fullName,
        role: u.role,
        is_active: u.isActive,
        created_at: u.createdAt,
      })),
      total,
    };
  }
}

export const adminService = new AdminService();
