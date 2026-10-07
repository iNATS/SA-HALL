create extension if not exists pgcrypto;
create extension if not exists citext;
create extension if not exists btree_gist;

comment on database sa_hall is
  'SA Hall target database. Business tables are introduced by verified, ordered migrations.';
