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
async function getRecipeFromDB(recipeId) {
  const results = await DButils.execQuery(`
    SELECT id, title, image, readyInMinutes, vegan, vegetarian, glutenFree, popularity, analyzedInstructions, summary, userId, extendedIngredients, servings
    FROM receipes
    WHERE id = ${recipeId}
    LIMIT 1;
  `);
  
  if (results.length === 0) {
    throw new Error("Recipe not found in DB");
  }

  const recipe = results[0];

  // extendedIngredients is stored as JSON string, parse it
  recipe.extendedIngredients = JSON.parse(recipe.extendedIngredients);

  // Optionally, convert tinyint(1) or int fields to booleans if needed:
  recipe.vegan = Boolean(recipe.vegan);
  recipe.vegetarian = Boolean(recipe.vegetarian);
  recipe.glutenFree = Boolean(recipe.glutenFree);
  recipe.internal = true;
  return recipe;
}
async function addRecipeToDB(recipe,userId) {
  let {title, image, readyInMinutes, vegan, vegetarian, glutenFree, extendedIngredients, analyzedInstructions, summary,servings } = recipe;

  // Convert extendedIngredients array to JSON string for storage
  const ingredientsJson = JSON.stringify(extendedIngredients);
  const instructionsJson = JSON.stringify(analyzedInstructions);
  await DButils.execQuery(`
      INSERT INTO receipes (title, image, readyInMinutes, vegan, vegetarian, glutenFree, popularity, analyzedInstructions, summary, userId, extendedIngredients, servings) 
      VALUES ('${title}', '${image}', ${readyInMinutes}, ${vegan}, ${vegetarian}, ${glutenFree}, 0, '${instructionsJson}', '${summary}', '${userId}', '${ingredientsJson}', ${servings})
  `);
}





async function addLike(user_id, recipeId) {
    return await DButils.execQuery(`
        INSERT INTO likes (user_id, recipe_id)
        VALUES ('${user_id}', ${recipeId})
    `);
}

async function deleteLike(user_id, recipeId) {
    return await DButils.execQuery(`
        DELETE FROM likes
        WHERE user_id='${user_id}' AND recipe_id=${recipeId}
    `);
}



async function isUserLikedRecipe(user_id, recipeId) {
    const likes = await DButils.execQuery(`
        SELECT COUNT(*) AS likesCount
        FROM likes
        WHERE user_id='${user_id}' AND recipe_id=${recipeId}
    `);
    return likes[0].likesCount > 0;
}

async function getLastViewedRecipes(userId) {
  const results = await DButils.execQuery(`
      SELECT recipeId, internalRecipe 
      FROM lastViewRecipes 
      WHERE userId='${userId}'
      ORDER BY lastView DESC
      LIMIT 3;
  `);
  return results;
}


function formatToMySQLDatetime(date) {
    return date.toISOString().slice(0, 19).replace('T', ' ');
}

async function updateLastViewedRecipe(userId, recipeId, internalRecipe) {
    const now = formatToMySQLDatetime(new Date());

    // Delete the current entry if it exists to avoid duplication
    await DButils.execQuery(`
        DELETE FROM lastViewRecipes 
        WHERE userId='${userId}' AND recipeId=${recipeId};
    `);

    // Insert the new view
    await DButils.execQuery(`
        INSERT INTO lastViewRecipes (userId, recipeId, lastView, internalRecipe)
        VALUES ('${userId}', ${recipeId}, '${now}', ${internalRecipe});
    `);

    // Delete oldest if more than 3 views exist
    await DButils.execQuery(`
        DELETE FROM lastViewRecipes
        WHERE userId='${userId}' AND recipeId NOT IN (
            SELECT recipeId FROM (
                SELECT recipeId FROM lastViewRecipes
                WHERE userId='${userId}'
                ORDER BY lastView DESC
                LIMIT 3
            ) AS temp
        );
    `);
}
async function getUserRecipes(userId) {
  const results = await DButils.execQuery(`
    SELECT id, title, image, readyInMinutes, vegan, vegetarian, glutenFree, popularity, analyzedInstructions, summary, userId, extendedIngredients, servings
    FROM receipes
    WHERE userId = '${userId}'
  `);
  return results;
}



exports.addLike = addLike;
exports.deleteLike = deleteLike;
exports.isUserLikedRecipe = isUserLikedRecipe;
exports.historyEntryExists = historyEntryExists;
exports.getHistoryRecipes = getHistoryRecipes;
exports.addToHistoryRecipes = addToHistoryRecipes;
exports.removeFavoriteRecipe = removeFavoriteRecipe;
exports.markAsFavorite = markAsFavorite;
exports.getFavoriteRecipes = getFavoriteRecipes;
exports.getRecipeFromDB = getRecipeFromDB;
exports.addRecipeToDB = addRecipeToDB;
exports.getLastViewedRecipes = getLastViewedRecipes;
exports.updateLastViewedRecipe = updateLastViewedRecipe;
exports.getUserRecipes = getUserRecipes;