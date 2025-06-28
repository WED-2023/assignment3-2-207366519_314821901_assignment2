const axios = require("axios");
const api_domain = "https://api.spoonacular.com/recipes";
const DButils = require("../utils/DButils");
const user_utils = require("./user_utils");


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

async function getRecipeDetails(recipe_id,userId) {
    let recipe_info = await getRecipeInformation(recipe_id);
    let { id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree, extendedIngredients, analyzedInstructions, summary, sourceName, servings } = recipe_info.data;
    const viewed = await isViewedRecipe(userId, recipe_id);
    const favorite = await isFavoriteRecipe(userId, recipe_id);
    const likes = await getRecipeLikes(recipe_id);
    console.log("servings", servings);
    return {
        id: id,
        title: title,
        readyInMinutes: readyInMinutes,
        image: image,
        popularity: aggregateLikes + likes,
        vegan: vegan,
        vegetarian: vegetarian,
        glutenFree: glutenFree,
        extendedIngredients: extendedIngredients,
        analyzedInstructions: analyzedInstructions,
        summary: summary,
        sourceName: sourceName,
        servings: servings,
        isViewedRecipe: viewed,
        isFavoriteRecipe: favorite
    }
}

async function getRecipesByArray(recipesArray,userId) {
    console.log("recipesArray", recipesArray);
    console.log("userId", userId);
  return await Promise.all(
    recipesArray.map(({ recipeId, internalRecipe }) => {
      if (internalRecipe) {
        const recipe = user_utils.getRecipeFromDB(recipeId);
        const likes = getRecipeLikes(recipeId);
        recipe.isViewedRecipe = true;
        recipe.isFavoriteRecipe = isFavoriteRecipe(userId, recipeId);
        recipe.popularity += likes;
        return recipe
      } else {
        return getRecipeDetails(recipeId, userId);
      }
    })
  );
}

async function isViewedRecipe(userId,recipeId) {
    console.log("Checking if recipe is viewed for user:", userId, "recipeId:", recipeId);
    const result = await DButils.execQuery(`
        SELECT * FROM historyviewrecipes WHERE userId='${userId}' AND recipeId=${recipeId}
    `);
    return result.length > 0 ? true : false;
}
async function isFavoriteRecipe(userId,recipeId) {
    const result = await DButils.execQuery(`
        SELECT * FROM favoriterecipes WHERE userId=${userId} AND recipeId=${recipeId}
    `);
    return result.length > 0 ? true : false;
}




async function getRandomRecipes(userId) {
  const response = await axios.get(`${api_domain}/random`, {
    params: {
      number: 3,
      apiKey: process.env.spooncular_apiKey
    }
  });

  const recipePromises = response.data.recipes.map(async recipe => {
    const likes = await getRecipeLikes(recipe.id);
    return {
      id: recipe.id,
      title: recipe.title,
      readyInMinutes: recipe.readyInMinutes,
      image: recipe.image,
      popularity: recipe.aggregateLikes + likes,
      vegan: recipe.vegan,
      vegetarian: recipe.vegetarian,
      glutenFree: recipe.glutenFree,
      extendedIngredients: recipe.extendedIngredients,
      analyzedInstructions: recipe.analyzedInstructions,
      summary: recipe.summary,
      sourceName: recipe.sourceName,
      servings: recipe.servings,
      isViewedRecipe: await isViewedRecipe(userId, recipe.id),
      isFavoriteRecipe: await isFavoriteRecipe(userId, recipe.id)
    };
  });

  return Promise.all(recipePromises); // resolves all async recipe mappings
}


async function getRecipeByText(userId,text, number, cuisine=null, diet=null, intolerance=null) {
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
    const recipes_details = await getRecipesByArray(recipes_id,userId);
    return recipes_details;
}


async function getRecipeLikes(recipeId) {
    const likes = await DButils.execQuery(`
        SELECT COUNT(*) AS likesCount
        FROM favoriterecipes
        WHERE recipeId=${recipeId}
    `);
    return likes[0].likesCount;
}

async function getFamilyRecipes(){
  const query = `
    SELECT recipe_id
    FROM family_recipes
  `;
  const family_recipes = await DButils.execQuery(query);
  console.log("family_recipes", family_recipes);
  try{
      const recipePromises = family_recipes.map(recipe =>
      user_utils.getRecipeFromDB(recipe.recipe_id)
    );
    const recipes = await Promise.all(recipePromises); // <-- Await all promises here
    return recipes;
  }catch(error){
    // it means that the recipe is not in the database
    console.error("No family recipes found for this user", error);
    return [];
  }
}


module.exports = {
  getRecipeLikes,
  getRecipesByArray,
  getFamilyRecipes,
//   updateLastViewedRecipe,
  getRecipeDetails,
  getRandomRecipes,
  getRecipeByText,
//   getLastViewedRecipes,
};



