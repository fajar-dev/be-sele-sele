export interface Page {
  id: string;
  icon: string | null;
  title: string;
  description: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  deletedAt: Date | null;
  members?: { email: string; name: string | null; isOwner: boolean; isPending: boolean; avatar: string | null }[];
}

export interface PageRepository {
  findAll(userEmail: string, page: number, limit: number, owned?: boolean): Promise<{ data: Page[]; total: number }>;
  findById(id: string, userEmail: string): Promise<Page | null>;
  checkOwnership(id: string, userEmail: string): Promise<boolean>;
  create(page: Omit<Page, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>, userEmail: string): Promise<Page>;
  update(id: string, page: Partial<Omit<Page, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>>): Promise<Page | null>;
  delete(id: string): Promise<boolean>;
  
  // Member Management
  getMembers(pageId: string, pending?: boolean): Promise<{ email: string; name: string | null; isOwner: boolean; isPending: boolean; avatar: string | null }[]>;
  addMember(pageId: string, email: string): Promise<boolean>;
  removeMember(pageId: string, email: string): Promise<boolean>;
  
  // Content Management
  updateContent(id: string, content: string): Promise<boolean>;
}
