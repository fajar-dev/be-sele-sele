export interface User {
  id: string;
  email: string;
  sub?: string | null;
  name?: string | null;
  avatar?: string | null;
  lastLoginIp: string | null;
  lastLoginAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  isActive: boolean | null;
}

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  upsert(user: { email: string; sub?: string; name?: string; avatar?: string; lastLoginIp: string | null; lastLoginAt: Date }): Promise<User>;
}
