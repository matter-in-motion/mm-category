'use strict';

const slug = low => ({
  type: 'string',
  pattern: '^[-a-z0-9_]{' + (low || 1) + ',60}$'
});

const title = () => ({
  type: 'string',
  maxLength: 140
});

const category = () => ({
  $id: 'resources/category',
  type: 'object',
  required: [ 'id', 'slug' ],
  additionalProperties: false,
  properties: {
    id: { format: 'uuid' },
    parent: { format: 'uuid' },
    slug: slug(),
    title: title(),
    categories: {
      type: 'array',
      items: { $ref: 'resources/category' }
    }
  }
})

module.exports = { slug, title, category };
