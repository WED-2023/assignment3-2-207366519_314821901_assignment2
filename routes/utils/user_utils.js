const DButils = require("./DButils");

async function markAsFavorite(user_id, recipe_id, internalRecipe) {
  await DButils.execQuery(`
    INSERT IGNORE INTO favoriteRecipes (userId, recipeId, internalRecipe)
    VALUES ('${user_id}', ${recipe_id}, ${internalRecipe});
  `);
}


async function getFavoriteRecipes(user_id){
    const id_internal = await DButils.execQuery(`select recipeId,internalRecipe from favoriteRecipes where userId='${user_id}'`);
    return id_internal;
}

async function removeFavoriteRecipe(userId, recipeId) {
  await DButils.execQuery(`
    DELETE FROM favoriteRecipes
    WHERE userId = '${userId}' AND recipeId = ${recipeId};
  `);
}


async function addToHistoryRecipes(userId, recipeId, internalRecipe) {
  await DButils.execQuery(`
    INSERT IGNORE INTO historyviewrecipes (userId, recipeId, internalRecipe)
    VALUES ('${userId}', ${recipeId}, ${internalRecipe});
  `);
}

async function getHistoryRecipes(userId) {
  const query = `
    SELECT recipeId, internalRecipe
    FROM historyviewrecipes
    WHERE userId = '${userId}'
    ORDER BY recipeId DESC
  `;
  return await DButils.execQuery(query);
}

async function historyEntryExists(userId, recipeId, internalRecipe) {
  const result = await DButils.execQuery(`
    SELECT 1 FROM historyviewrecipes
    WHERE userId = '${userId}' AND recipeId = ${recipeId} AND internalRecipe = ${internalRecipe}
    LIMIT 1;
  `);
  return result.length > 0;
}

exports.historyEntryExists = historyEntryExists;
exports.getHistoryRecipes = getHistoryRecipes;
exports.addToHistoryRecipes = addToHistoryRecipes;
exports.removeFavoriteRecipe = removeFavoriteRecipe;
exports.markAsFavorite = markAsFavorite;
exports.getFavoriteRecipes = getFavoriteRecipes;
