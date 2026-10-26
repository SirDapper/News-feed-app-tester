-- Link each item to its source so the apps can show the outlet's name and
-- trust tier with one query. The worker upserts the sources table from
-- apps/worker/src/sources.ts at the start of every run.

alter table items
  add constraint items_source_fk foreign key (source_id) references sources(id);
