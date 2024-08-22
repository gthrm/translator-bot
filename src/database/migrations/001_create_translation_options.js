exports.up = function (knex) {
  return knex.schema.createTable('translation_options', (table) => {
    table.string('userId').primary();
    table.string('selectedStyle').notNullable().defaultTo('Professional');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('translation_options');
};
