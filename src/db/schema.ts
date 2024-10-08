import { index, int, mysqlTable, bigint, varchar } from 'drizzle-orm/mysql-core';

export const countries = mysqlTable('countries', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  name: varchar('name', { length: 256 }),
  code: varchar('code', { length: 4 }),
}, (countries) => ({
  nameIdx: index('name_idx').on(countries.name),
}));

export const banks = mysqlTable('banks', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  name: varchar('name', { length: 256 }),
  countryId: bigint("country_id", { mode: 'number' }).references(() => countries.id)
}, (banks) => ({
  nameIdx: index('name_idx').on(banks.name),
}));

export const branches = mysqlTable('branches', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  name: varchar('name', { length: 256 }),
  bankId: bigint("bank_id", { mode: 'number' }).references(() => banks.id)
}, (branches) => ({
  nameIdx: index('name_idx').on(branches.name),
}));

export const swiftcodes = mysqlTable('swiftcodes', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  name: varchar('name', { length: 256 }),
  branchId: bigint("branch_id", { mode: 'number' }).references(() => branches.id)
}, (swiftcodes) => ({
  nameIdx: index('name_idx').on(swiftcodes.name),
}));