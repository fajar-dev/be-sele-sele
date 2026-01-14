import { Page, PageRepository } from '../domain/entity/page';

export class PageUsecase {
  constructor(private pageRepo: PageRepository) {}

  async getPages(userEmail: string, page: number = 1, limit: number = 10, owned?: boolean): Promise<{ data: Page[]; total: number }> {
    return this.pageRepo.findAll(userEmail, page, limit, owned);
  }

  async getPage(id: string, userEmail: string): Promise<Page | null> {
    return this.pageRepo.findById(id, userEmail);
  }

  async createPage(data: { title: string; icon?: string | null; description?: string | null }, userEmail: string): Promise<Page> {
    return this.pageRepo.create({
      title: data.title,
      icon: data.icon ?? null,
      description: data.description ?? null,
    }, userEmail);
  }

  async updatePage(id: string, data: { title?: string; icon?: string | null; description?: string | null }, userEmail: string): Promise<Page | null> {
    const isOwner = await this.pageRepo.checkOwnership(id, userEmail);
    if (!isOwner) return null;
    
    return this.pageRepo.update(id, data);
  }

  async deletePage(id: string, userEmail: string): Promise<boolean> {
    const isOwner = await this.pageRepo.checkOwnership(id, userEmail);
    if (!isOwner) return false;

    return this.pageRepo.delete(id);
  }

  async getMembers(pageId: string, userEmail: string, pending?: boolean): Promise<{ email: string; name: string | null; isOwner: boolean; isPending: boolean; avatar: string | null }[] | null> {
    const hasAccess = await this.pageRepo.findById(pageId, userEmail);
    if (!hasAccess) return null;

    return this.pageRepo.getMembers(pageId, pending);
  }

  async addMember(pageId: string, targetEmail: string, userEmail: string): Promise<boolean> {
    const isOwner = await this.pageRepo.checkOwnership(pageId, userEmail);
    if (!isOwner) return false;

    return this.pageRepo.addMember(pageId, targetEmail);
  }

  async removeMember(pageId: string, targetEmail: string, userEmail: string): Promise<boolean> {
    const isOwner = await this.pageRepo.checkOwnership(pageId, userEmail);
    if (!isOwner) return false;

    return this.pageRepo.removeMember(pageId, targetEmail);
  }

  async updateContent(id: string, content: string, userEmail: string): Promise<boolean> {
    const hasAccess = await this.pageRepo.findById(id, userEmail);
    if (!hasAccess) return false;

    return this.pageRepo.updateContent(id, content);
  }

  async getMarkdownFilePath(id: string, userEmail: string): Promise<string | null> {
    const hasAccess = await this.pageRepo.findById(id, userEmail);
    if (!hasAccess) return null;

    const cwd = process.cwd();
    return `${cwd}/file/${id}.md`;
  }

  async getPageContent(id: string, userEmail: string): Promise<string | null> {
    const filePath = await this.getMarkdownFilePath(id, userEmail);
    if (!filePath) return null;

    try {
      const file = Bun.file(filePath);
      if (await file.exists()) {
        return await file.text();
      }
      return '';
    } catch (error) {
       console.error(`Error reading file ${filePath}:`, error);
       return null;
    }
  }

  async getPermission(id: string, userEmail: string): Promise<{ isOwner: boolean }> {
    const isOwner = await this.pageRepo.checkOwnership(id, userEmail);
    return { isOwner };
  }
}
