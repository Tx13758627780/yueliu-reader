import {sqliteTable,text,integer,index} from 'drizzle-orm/sqlite-core';
export const notes=sqliteTable('notes',{id:text('id').primaryKey(),owner:text('owner').notNull(),article:text('article').notNull(),data:text('data').notNull(),audio:text('audio'),updated:integer('updated').notNull()},t=>[index('notes_owner_article').on(t.owner,t.article)]);
