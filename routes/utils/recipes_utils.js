const axios = require("axios");
const api_domain = "https://api.spoonacular.com/recipes";
const DButils = require("../utils/DButils");
var idCounter = 0;


/**
 * Get recipes list from spooncular response and extract the relevant recipe data for preview
 * @param {*} recipes_info 
 */


async function getRecipeInformation(recipe_id) {
    return await axios.get(`${api_domain}/${recipe_id}/information`, {
        params: {
            includeNutrition: false,
            apiKey: process.env.spooncular_apiKey
        }
    });
}

async function getRecipeDetails(recipe_id) {
    let recipe_info = await getRecipeInformation(recipe_id);
    let { id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree, extendedIngredients, instructions, summary, sourceName } = recipe_info.data;
    return {
        id: id,
        title: title,
        readyInMinutes: readyInMinutes,
        image: image,
        popularity: aggregateLikes,
        vegan: vegan,
        vegetarian: vegetarian,
        glutenFree: glutenFree,
        extendedIngredients: extendedIngredients,
        instructions: instructions,
        summary: summary,
        sourceName: sourceName,
    }
}

async function getRecipesByArray(recipesArray) {
  return await Promise.all(
    recipesArray.map(({ recipeId, internalRecipe }) => {
      if (internalRecipe) {
        return getRecipeFromDB(recipeId);
      } else {
        return getRecipeDetails(recipeId);
      }
    })
  );
}
    




async function getRandomRecipes() {
    const respone = await axios.get(`${api_domain}/random`, {
        params: {
            number: 3,
            apiKey: process.env.spooncular_apiKey
        }
    });
    return respone.data.recipes.map(recipe => {
        return {
            id: recipe.id,
            title: recipe.title,
            readyInMinutes: recipe.readyInMinutes,
            image: recipe.image,
            popularity: recipe.aggregateLikes,
            vegan: recipe.vegan,
            vegetarian: recipe.vegetarian,
            glutenFree: recipe.glutenFree,
            extendedIngredients: recipe.extendedIngredients,
            instructions: recipe.instructions,
            summary: recipe.summary,
            sourceName: recipe.sourceName,
        }
    });
}

async function getRecipeByText(text, number) {
    const respone = await axios.get(`${api_domain}/complexSearch`, {
        params: {
            query: text,
            number: number,
            apiKey: process.env.spooncular_apiKey
        }
    });
    return respone.data.results.map(recipe => {
        return {
            id: recipe.id,
            title: recipe.title,
            image: recipe.image,
        }
    });
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





module.exports = {
  getRecipeFromDB,
  getRecipesByArray,
  updateLastViewedRecipe,
  getRecipeDetails,
  getRandomRecipes,
  getRecipeByText,
  addRecipeToDB,
};



