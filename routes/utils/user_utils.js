const DButils = require("./DButils");

async function markAsFavorite(user_id, recipe_id, internalRecipe) {
  await DButils.execQuery(`
    INSERT IGNORE INTO favoriteRecipes (userId, recipeId, internalRecipe)
    VALUES ('${user_id}', ${recipe_id}, ${internalRecipe});
  `);
}


async function getFavoriteRecipes(user_id){
    const recipes_id = await DButils.execQuery(`select recipe_id from favoriteRecipes where user_id='${user_id}'`);
    return recipes_id;
}

async function removeFavoriteRecipe(userId, recipeId) {
  await DButils.execQuery(`
    DELETE FROM favoriteRecipes
    WHERE userId = '${userId}' AND recipeId = ${recipeId};
  `);
}

exports.removeFavoriteRecipe = removeFavoriteRecipe;
exports.markAsFavorite = markAsFavorite;
exports.getFavoriteRecipes = getFavoriteRecipes;
