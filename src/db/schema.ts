import { mysqlTable, varchar, text, timestamp, boolean } from 'drizzle-orm/mysql-core';
import { uuidv7 } from 'uuidv7';

export const pages = mysqlTable('pages', {
    id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => uuidv7()),
    icon: varchar('icon', { length: 255 }),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
    deletedAt: timestamp('deleted_at'),
});

export const users = mysqlTable('users', {
    id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => uuidv7()),
    email: varchar('email', { length: 255 }).notNull().unique(),
    sub: varchar('sub', { length: 255 }).unique(),
    name: varchar('name', { length: 255 }),
    avatar: text('avatar'),
    lastLoginIp: varchar('last_login_ip', { length: 45 }),
    lastLoginAt: timestamp('last_login_at'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
    isActive: boolean('is_active').default(true),
});

export const collaborations = mysqlTable('collaborations', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => uuidv7()),
  pageId: varchar('page_id', { length: 36 }).notNull().references(() => pages.id),
  email: varchar('email', { length: 255 }).notNull(),
  isOwner: boolean('is_owner').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});


