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

async function getRecipesByArray(recipes_id_array) {
  return await Promise.all(recipes_id_array.map(id => getRecipeDetails(id)));
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

async function addRecipe(recipe) {
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






exports.getRecipesByArray = getRecipesByArray;
exports.updateLastViewedRecipe = updateLastViewedRecipe;
exports.getRecipeDetails = getRecipeDetails;
exports.getRandomRecipes = getRandomRecipes;
exports.getRecipeByText = getRecipeByText;
exports.addRecipe = addRecipe;


