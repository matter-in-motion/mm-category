'use strict';
const test = require('ava');
const extension = require('./index');
const createApp = require('mm-test').createApp;

const rxUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

process.env.NODE_ENV = 'production';
const app = createApp({
  extensions: [
    'rethinkdb',
    'rethinkdb-schema',
    'rethinkdb-unique',
    'db-schema',
    extension
  ],

  rethinkdb: {
    db: 'test',
    silent: true
  }
});

const category = app.units.require('resources.category.controller');

test.before(() => app.run('db', 'updateSchema'));
test.after.always(() => app.run('db', 'dropSchema'));

test('fails to get uknown category', t => category
  .get({ id: 'fail' })
  .then(() => t.fail())
  .catch(e => t.is(e.code, 4540))
);

let cat1
test.serial('creates a category', t => category
  .create({
    title: 'Title'
  })
  .then(cat => {
    t.regex(cat.id, rxUUID);
    t.is(cat.slug, 'title');
    t.is(cat.title, 'Title');
    cat1 = cat;
  })
);

test.serial('fails to create category with existed slug', t => category
  .create({ slug: 'title' })
  .then(() => t.fail())
  .catch(e => t.is(e.code, 4500)) // Dublicate
);

test.serial('updates a category title', t => category
  .update(cat1.id, {
    slug: 'title1',
    title: 'Title 1'
  })
  .then(() => category.get({ id: cat1.id }))
  .then(cat => {
    t.regex(cat.id, rxUUID);
    t.is(cat.slug, 'title1');
    t.is(cat.title, 'Title 1');
    cat1 = cat;
  })
);

let cat2
test.serial('creates a category with a wrong slug', t => category
  .create({
    slug: 'category test',
    title: 'Category'
  })
  .then(cat => {
    t.regex(cat.id, rxUUID);
    t.is(cat.slug, 'category-test');
    t.is(cat.title, 'Category');
    cat2 = cat;
  })
);

test.serial('gets a category by id', t => category
  .get({ id: cat1.id })
  .then(cat => {
    t.is(cat.id, cat1.id);
    t.is(cat.title, cat1.title);
    t.is(cat.slug, cat1.slug);
  })
)

test.serial('gets a category by slug', t => category
  .get({ slug: cat1.slug })
  .then(cat => {
    t.is(cat.id, cat1.id);
    t.is(cat.title, cat1.title);
    t.is(cat.slug, cat1.slug);
  })
)

let sub1;
test.serial('creates a sub category', t => category
  .create({
    parent: cat1.id,
    title: 'Sub Category'
  })
  .then(cat => {
    t.regex(cat.id, rxUUID);
    t.is(cat.slug, 'sub-category');
    t.is(cat.title, 'Sub Category');
    t.is(cat.parent, cat1.id);
    sub1 = cat;
  })
);

test.serial('creates a sub sub category', t => category
  .create({
    parent: sub1.id,
    title: 'Sub 3 Category'
  })
  .then(cat => {
    t.regex(cat.id, rxUUID);
    t.is(cat.slug, 'sub-3-category');
    t.is(cat.title, 'Sub 3 Category');
    t.is(cat.parent, sub1.id);
  })
);

test.serial('creates a sub category', t => category
  .create({
    parent: cat1.id,
    title: 'Sub 2 Category'
  })
  .then(cat => {
    t.regex(cat.id, rxUUID);
    t.is(cat.slug, 'sub-2-category');
    t.is(cat.title, 'Sub 2 Category');
    t.is(cat.parent, cat1.id);
  })
);

test.serial('gets the category by id with sub categories', t => category
  .get({ id: cat1.id })
  .then(cat => {
    t.is(cat.id, cat1.id);
    t.is(cat.slug, cat1.slug);
    t.is(cat.title, cat1.title);
    t.truthy(cat.categories);
    t.regex(cat.categories[1].id, rxUUID);
    t.regex(cat.categories[0].id, rxUUID);
  })
);

test.serial('gets the category by slug with sub categories', t => category
  .get({ slug: cat1.slug })
  .then(cat => {
    t.is(cat.id, cat1.id);
    t.is(cat.slug, cat1.slug);
    t.is(cat.title, cat1.title);
    t.truthy(cat.categories);
    t.regex(cat.categories[0].id, rxUUID);
    t.regex(cat.categories[1].id, rxUUID);
  })
);

test.serial('get all top level categories', t => category
  .get()
  .then(cats => {
    t.is(cats.length, 2);
    t.regex(cats[0].id, rxUUID);
    t.regex(cats[1].id, rxUUID);
  })
)

test.serial('deletes a category', t => category
  .delete(cat2.id)
  .then(id => {
    t.is(id, cat2.id);
  })
)

test.serial('fails to get the deleted category', t => category
  .get({ id: cat2.id })
  .then(() => t.fail())
  .catch(e => t.is(e.code, 4540))
)

test.serial('deletes a category with all children', t => category
  .delete(cat1.id)
  .then(id => {
    t.is(id, cat1.id);
  })
)

test.serial('gets nothing', t => category
  .get()
  .then(res => {
    t.is(res.length, 0);
  })
)
