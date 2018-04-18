exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTable('words', function(table) {
      table.increments('id').primary();
      table.string('word');
      table.string('meaning');
      table.integer('user_id').unsigned().notNullable().references('id').inTable('users');
    }),
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTable('words'),
  ]);
};
