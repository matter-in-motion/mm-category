'use strict';
const errors = require('mm-errors');
const types = require('../types');

const ReqlDriverError = function(e) {
  if (e.name === 'ReqlDriverError') {
    throw errors.ServerError(null, e.msg);
  }

  throw e;
}

module.exports = {
  __expose: true,

  get: function() {
    const id = {
      type: 'object',
      additionalProperties: false,
      required: [ 'id' ],
      properties: {
        id: { format: 'uuid' }
      }
    };

    const slug = {
      type: 'object',
      additionalProperties: false,
      required: [ 'slug' ],
      properties: {
        slug: types.slug()
      }
    };

    const empty = {
      type: 'null'
    };

    return {
      auth: {
        provider: 'user',
        required: 'optional'
      },
      title: 'Category',
      description: 'Returns a categories tree or subtree',
      request: {
        anyOf: [ id, slug, empty ]
      },

      response: {
        anyOf: [
          {
            type: 'array',
            items: types.category()
          },
          types.category()
        ]
      },

      call: (auth, data) => this.get(data)
        .catch(ReqlDriverError)
        .catch(errors.ifError('NotFound'))
    }
  },

  create: function() {
    return {
      auth: {
        provider: 'user',
        required: true
      },
      title: 'Category',
      description: 'Creates a category',
      request: {
        type: 'object',
        additionalProperties: false,
        required: [ 'title' ],
        properties: {
          slug: types.slug(),
          title: types.title(),
          index: {
            type: 'number',
            minValue: 0
          },
          parent: { format: 'uuid' }
        }
      },
      response: types.category(),

      call: (auth, data) => this.create(data)
        .catch(ReqlDriverError)
        .catch(errors.ifError('BadRequest'))
    }
  },

  update: function() {
    return {
      auth: {
        provider: 'user',
        required: true
      },
      title: 'Category',
      description: 'Updates a category properties',
      request: {
        type: 'object',
        additionalProperties: false,
        required: [ 'id', 'to' ],
        properties: {
          id: { format: 'uuid' },
          to: {
            type: 'object',
            additionalProperties: false,
            minProperties: 1,
            properties: {
              slug: types.slug(),
              title: types.title(),
              parent: { format: 'uuid' }
            }
          }
        }
      },

      response: { format: 'uuid' },

      call: (auth, data) => this
        .update(data.id, data.to)
        .catch(ReqlDriverError)
        .catch(errors.ifError('BadRequest'))
    }
  },

  delete: function() {
    return {
      auth: {
        provider: 'user',
        required: true
      },
      title: 'Category',
      description: 'Deletes a category with all its children',
      request: {
        type: 'object',
        additionalProperties: false,
        required: [ 'id' ],
        properties: {
          id: { format: 'uuid' }
        }
      },

      response: { format: 'uuid' },

      call: (auth, data) => this.delete(data.id)
        .catch(ReqlDriverError)
        .catch(errors.ifError('BadRequest'))
    }
  }
};
