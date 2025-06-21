const axios = require("axios");
const api_domain = "https://api.spoonacular.com/recipes";
const DButils = require("../utils/DButils");


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

async function getRecipeByText(text, number, cuisine=null, diet=null, intolerance=null) {
    const respone = await axios.get(`${api_domain}/complexSearch`, {
        params: {
            query: text,
            number: number,
            apiKey: process.env.spooncular_apiKey,
            ...(cuisine && { cuisine }),
            ...(diet && { diet }),
            ...(intolerance && { intolerances: intolerance })
        }
    });
    const recipes_id = respone.data.results.map(recipe => {return {recipeId:recipe.id,internalRecipe:false}});
    const recipes_details = await getRecipesByArray(recipes_id);
    return recipes_details;
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
async function getLastViewedRecipes(userId) {
    const results = await DButils.execQuery(`
        SELECT recipeId, lastView, internalRecipe 
        FROM lastViewRecipes 
        WHERE userId='${userId}'
        ORDER BY lastView DESC
        LIMIT 3;
    `);
    return results;
}




async function getRecipeLikes(recipeId) {
    const likes = await DButils.execQuery(`
        SELECT COUNT(*) AS likesCount
        FROM likes
        WHERE recipe_id=${recipeId}
    `);
    return likes[0].likesCount;
}


module.exports = {
  getRecipeLikes,
  getRecipesByArray,
  updateLastViewedRecipe,
  getRecipeDetails,
  getRandomRecipes,
  getRecipeByText,
  getLastViewedRecipes,
};



