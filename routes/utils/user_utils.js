const DButils = require("./DButils");
const recipes_utils = require("./recipes_utils");
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
    SELECT id, title, image, readyInMinutes, vegan, vegetarian, glutenFree, popularity, instructions, summary, sourceName, extendedIngredients, servings
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

  return recipe;
}
async function addRecipeToDB(recipe) {
  let { id, title, image, readyInMinutes, vegan, vegetarian, glutenFree, extendedIngredients, instructions, summary, sourceName, servings } = recipe;
  if (!id){
      id = idCounter++;
  }
  // Convert extendedIngredients array to JSON string for storage
  const ingredientsJson = JSON.stringify(extendedIngredients);
  
  await DButils.execQuery(`
      INSERT INTO receipes (id, title, image, readyInMinutes, vegan, vegetarian, glutenFree, popularity, instructions, summary, sourceName, extendedIngredients, servings) 
      VALUES (${id}, '${title}', '${image}', ${readyInMinutes}, ${vegan}, ${vegetarian}, ${glutenFree}, 0, '${instructions}', '${summary}', '${sourceName}', '${ingredientsJson}', ${servings})
  `);
}
async function getFamilyRecipes(user_id){
  const query = `
    SELECT recipe_id, familyowner, whenmade
    FROM family_recipes
    WHERE user_id = '${user_id}'
  `;
  const family_recipes = await DButils.execQuery(query);
  try{
    const recipes = family_recipes.map(recipe => {return getRecipeFromDB(recipe.recipe_id)})
    return recipes;
  }catch(error){
    // it means that the recipe is not in the database
    console.error("No family recipes found for this user", error);
    return [];
  }
}

exports.historyEntryExists = historyEntryExists;
exports.getHistoryRecipes = getHistoryRecipes;
exports.addToHistoryRecipes = addToHistoryRecipes;
exports.removeFavoriteRecipe = removeFavoriteRecipe;
exports.markAsFavorite = markAsFavorite;
exports.getFavoriteRecipes = getFavoriteRecipes;
exports.getRecipeFromDB = getRecipeFromDB;
exports.addRecipeToDB = addRecipeToDB;
exports.getFamilyRecipes = getFamilyRecipes;