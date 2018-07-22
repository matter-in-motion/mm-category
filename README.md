# Matter In Motion. Category resource extension

[![NPM Version](https://img.shields.io/npm/v/mm-category.svg?style=flat-square)](https://www.npmjs.com/package/mm-category)
[![NPM Downloads](https://img.shields.io/npm/dt/mm-category.svg?style=flat-square)](https://www.npmjs.com/package/mm-category)

This extension adds a __category__ resource.

## Usage

[Extensions installation instructions](https://github.com/matter-in-motion/mm/blob/master/docs/extensions.md)

## Dependencies

* __[rethinkdb](https://github.com/matter-in-motion/mm-rethinkdb)__
* __[rethinkdb-unique](https://github.com/matter-in-motion/mm-rethinkdb-unique)__
* [db-schema](https://github.com/matter-in-motion/mm-db-schema)
* [rethinkdb-schema](https://github.com/matter-in-motion/mm-rethinkdb-schema)

## Settings

This extension does not have any settings.

## Category

* __id__ — uuid, the id of the category.
* __slug__ — string, 60 chars max, a user- and SEO-friendly short unique text used in a URL to identify and describe the category.
* __title__ — string, 140 chars max.
* parent — uuid, the parent category id.
* categories — array of the sub categories

## API

### get

Returns a category or categories collection.

**Request**

* **id** — category's id, returns a category with all subcategories

or

* **slug** — category's slug, returns a category with all subcategories

or

* empty, returns all first level categories with all subcategories

**Response**

A single category or array of categories.

### create

**Request**

Creates a new category.

* __title__ — string, 140 chars max.
* slug — string, slug
* parent — uuid, parent category id.

**Response**

Full-formed category object.

### update

updates the category content

**Request**

* **to**
  - slug — string, category's slug.
  - title — string, 140 chars max.
  - parent — uuid, parent category id.

**Response**

* changed category id

### delete

Deletes category

**Request**

* __id__ — uuid, id of the category

**Response**

* deleted category id


## Controller Methods

TBD

License: MIT.
