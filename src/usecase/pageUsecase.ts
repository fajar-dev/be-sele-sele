import { Page, PageRepository } from '../domain/entity/page';

export class PageUsecase {
  constructor(private pageRepo: PageRepository) {}

  async getPages(userEmail: string, page: number = 1, limit: number = 10, owned?: boolean): Promise<{ data: Page[]; total: number }> {
    return this.pageRepo.findAll(userEmail, page, limit, owned);
  }

  async getPage(id: string, userEmail: string): Promise<Page | null> {
    return this.pageRepo.findById(id, userEmail);
    // If null, it means either not found OR no permission, effectively same for security.
  }

  async createPage(data: { title: string; icon?: string | null; description?: string | null }, userEmail: string): Promise<Page> {
    return this.pageRepo.create({
      title: data.title,
      icon: data.icon ?? null,
      description: data.description ?? null,
    }, userEmail);
  }

  async updatePage(id: string, data: { title?: string; icon?: string | null; description?: string | null }, userEmail: string): Promise<Page | null> {
    // Check ownership first
    const isOwner = await this.pageRepo.checkOwnership(id, userEmail);
    if (!isOwner) return null; // Not owner or not found
    
    return this.pageRepo.update(id, data);
  }

  async deletePage(id: string, userEmail: string): Promise<boolean> {
    // Check ownership first
    const isOwner = await this.pageRepo.checkOwnership(id, userEmail);
    if (!isOwner) return false;

    return this.pageRepo.delete(id);
  }

  async getMembers(pageId: string, userEmail: string): Promise<{ email: string; name: string | null; isOwner: boolean; isPending: boolean; avatar: string | null }[] | null> {
    // Check permission - "get semua data member pada pages". Usually implies access.
    // If user has access (is member/owner), they can see members.
    const hasAccess = await this.pageRepo.findById(pageId, userEmail);
    if (!hasAccess) return null;

    return this.pageRepo.getMembers(pageId);
  }

  async addMember(pageId: string, targetEmail: string, userEmail: string): Promise<boolean> {
    // Check ownership - "untuk update dan delete hanya user is_owner = true"
    // Does this apply to member management?
    // "untuk update dan delete hanya user is_owner = true di pages tersebut" - assume adding/removing member is an update/admin action.
    const isOwner = await this.pageRepo.checkOwnership(pageId, userEmail);
    if (!isOwner) return false;

    return this.pageRepo.addMember(pageId, targetEmail);
  }

  async removeMember(pageId: string, targetEmail: string, userEmail: string): Promise<boolean> {
    // Check ownership
    const isOwner = await this.pageRepo.checkOwnership(pageId, userEmail);
    if (!isOwner) return false;

    return this.pageRepo.removeMember(pageId, targetEmail);
  }

  async updateContent(id: string, content: string, userEmail: string): Promise<boolean> {
    // Check ownership ("serta ubah juga jika edit dan delete /pages harus is_owner = true")
    // Assuming content update is an edit, so requires ownership. 
    // Wait, previous prompt said "edit dan delete /pages harus is_owner = true". 
    // This is `POST /pages/:id` for content. Is it considered an edit?
    // "bodynya content, setiap diisi maka ubah isi file markdownnya serta beruba updated_at pada row table pages"
    // Usually editing content is an edit. I'll enforce ownership.
    const isOwner = await this.pageRepo.checkOwnership(id, userEmail);
    if (!isOwner) return false;

    return this.pageRepo.updateContent(id, content);
  }
}
