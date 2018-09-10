'use strict';
const slugify = require('slugify');
// const hooks = require('async-hooks');

const errors = require('mm-errors');
const notFound = function(e) {
  if (e.msg === 'Not found') {
    throw errors.NotFound();
  }

  throw e;
}

const Controller = function() {
  this.r = undefined;
};

Controller.prototype.schema = {
  category: {
    db: 'rethinkdb',
    table: 'categories',
    indexes: [ 'slug', 'parent' ]
  },

  slug: {
    db: 'rethinkdb',
    table: 'categories_slugs'
  }
};

Controller.prototype.__init = function(units) {
  this.table = this.schema.category.table;
  this.slugs = this.schema.slug.table;
  this.r = units.require('db.rethinkdb');
  this.unique = units.require('db.rethinkdb.unique');
};

Controller.prototype.get = function(opts) {
  return this._get(opts).run().catch(notFound);
};

Controller.prototype._get = function(opts = {}) {
  const r = this.r;
  let query = r.table(this.table);

  if (opts.id) {
    query = query.get(opts.id);
  } else if (opts.slug) {
    query = query.getAll(opts.slug, { index: 'slug' }).nth(0);
  } else {
    query = query.filter(r.row.hasFields('parent').not());
  }

  query = query.default(r.error('Not found'));

  if (opts.noSub) {
    return query;
  }

  return query.merge(this.mergeSubCategories())
};

Controller.prototype.getAll = function(ids, opts) {
  const query = this.r.table(this.table).getAll(...ids);
  if (opts.noSub) {
    return query;
  }

  return query.merge(this.mergeSubCategories());
};

Controller.prototype.mergeSubCategories = function() {
  const r = this.r;
  return cat => {
    const children = r.table(this.table).getAll(cat('id'), { index: 'parent' });
    return r.branch(
      children.isEmpty(),
      {},
      {
        categories: children.coerceTo('array')//.merge(merge) doesn't work yet
      }
    )
  }
};

Controller.prototype.create = function(category, index) {
  category.slug = slugify(category.slug || category.title, { lower: true });
  return this.unique.ensure(this.slugs, category.slug)
    .then(() => this.r.table(this.table)
      .insert(category)
      .run()
    )
    .then(res => {
      category.id = res.generated_keys[0];
      return category;
    });
};

Controller.prototype.update = function(id, to) {
  return Promise.resolve(to)
    .then(to => {
      if (to.slug) {
        return this._get({ id, noSub: true })('slug')
          .run()
          .then(slug => this.unique.rename(this.slugs, slug, to.slug));
      }
    })
    .then(() => this._get({ id, noSub: true })
      .update(to)
      .run()
    )
    .catch(notFound)
    .then(() => id);
};

Controller.prototype.delete = function(id) {
  return this._get({ id, noSub: true })
    .delete()
    .run()
    .catch(notFound)
    .then(changes => {
      if (changes.deleted) {
        return this.deleteAllChildren([ id ]);
      }
    })
    .then(() => id);
};

Controller.prototype.deleteAllChildren = function(ids) {
  return this.r.table(this.table).getAll(...ids, { index: 'parent' })
    .delete({ returnChanges: true })
    .run()
    .then(changes => {
      if (changes.deleted) {
        const ids = changes.changes.map(({ old_val }) => old_val.id);
        return this.deleteAllChildren(ids);
      }
    });
};


module.exports = Controller;
