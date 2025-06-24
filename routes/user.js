var express = require("express");
var router = express.Router();
const DButils = require("./utils/DButils");
const user_utils = require("./utils/user_utils");
const recipe_utils = require("./utils/recipes_utils");

/**
 * Authenticate all incoming requests by middleware
 */

router.use(async function (req, res, next) {
  try {
    // Mock user_id for testing - Replace with actual authentication logic
    // req.session.user_id = 1; 
    console.log("user id :",req.session.user_id);
    if (req.session && req.session.user_id) {
      const users = await DButils.execQuery("SELECT user_id FROM users");
      if (users.find((x) => x.user_id === req.session.user_id)) {
        req.user_id = req.session.user_id;
        next();
      } else {
        res.status(401).send("User not found");
      }
    } else {
      res.status(401).send("No session found");
    }
  } catch (err) {
    console.error("Authentication middleware error:", err);
    next(err);
  }
});


/**
 * This path gets body with recipeId and save this recipe in the favorites list of the logged-in user
 */
router.post('/favorites', async (req,res,next) => {
  try{
    const user_id = req.session.user_id;
    const recipe_id = req.body.recipeId;
    const internalRecipe = req.body.internalRecipe || false; //default to false if not provided
    await user_utils.markAsFavorite(user_id,recipe_id, internalRecipe);
    res.status(200).send("The Recipe successfully saved as favorite");
    } catch(error){
    next(error);
  }
})

/**
 * This path returns the favorites recipes that were saved by the logged-in user
 */
router.get('/favorites', async (req,res,next) => {
  try{
    const user_id = req.session.user_id;
    const favorites = await user_utils.getFavoriteRecipes(user_id);
    const results = await recipe_utils.getRecipesByArray(favorites,user_id);
    res.status(200).json(results);
  } catch(error){
    next(error); 
  }
});

router.delete("/favorites", async (req, res, next) => {
  try {
    const userId = req.session.user_id;
    const { recipeId } = req.body;

    if (!recipeId) {
      return res.status(400).send("Missing recipeId");
    }

    await user_utils.removeFavoriteRecipe(userId, recipeId);
    res.status(200).send("Recipe removed from favorites");
  } catch (err) {
    res.status(500).send("Error removing recipe from favorites");
  }
});


router.post("/history", async (req, res, next) => {
  try {
    const userId = req.session.user_id;
    const {recipeId, internalRecipe } = req.body;
    await user_utils.addToHistoryRecipes(userId, recipeId, internalRecipe);
    res.status(200).send("Recipe added successfully.");
  } catch (error) {
    next(error);
  }
});

router.get("/history", async (req, res, next) => {
  try {
    const userId = req.session.user_id;
    const history = await user_utils.getHistoryRecipes(userId);
    console.log(history)
    res.status(200).json(history);
  } catch (error) {
    next(error);
  }
});

  router.post("/RecipeDB", async (req, res, next) => {
    try {
      await user_utils.addRecipeToDB(req.body, req.session.user_id);
      res.status(201).send("Recipe successfully added to database");
    } catch (error) {
      next(error);
    }
  });

  router.get("/RecipeDB", async (req, res, next) => {
    try {
      const recipeId = req.query.recipeId;
      if (!recipeId) {
        return res.status(400).send("Missing recipeId query parameter.");
      }

      const recipe = await user_utils.getRecipeFromDB(recipeId);
      res.status(200).json(recipe);
    } catch (error) {
      if (error.message === "Recipe not found in DB") {
        res.status(404).send(error.message);
      } else {
        next(error);
      }
    }
  });

  router.get('/familyrecipes', async (req, res) => {
    try {
      const user_id = req.session.user_id;
      const family_recipes = await user_utils.getFamilyRecipes(user_id);
      res.status(200).send(family_recipes);
    } catch (error) {
      console.error("Error fetching family recipes:", error);
      res.status(500).send({ message: "Internal Server Error" });
    }
  });


router.post("/like", async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    const recipeId = req.body.recipeId;
    await user_utils.addLike(user_id, recipeId);
    res.status(200).send("like added successfully");
  } catch (error) {
    next(error);
  }
});

router.delete("/like", async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    const recipeId = req.body.recipeId;
    await user_utils.deleteLike(user_id, recipeId);
    res.status(200).send("like deleted successfully");
  } catch (error) {
    next(error);
  }
});



router.get("/userLikedRecipe", async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    const recipeId = req.query.recipeId;
    const isLiked = await user_utils.isUserLikedRecipe(user_id, recipeId);
    res.status(200).send(isLiked);
  } catch (error) {
    next(error);
  }
});
router.get("/getLastViewedRecipes", async (req, res, next) => {
  try {
    const userId = req.session.user_id;
    console.log("user id in getLastViewedRecipes:",userId);
    const lastViewed = await user_utils.getLastViewedRecipes(userId);
    const results = await recipe_utils.getRecipesByArray(lastViewed,userId);
    res.send(results);
  } catch (error) {
    next(error);
  }
});

router.post("/addToViewRecipe", async (req, res, next) => {
  try {
    const userId = req.session.user_id;
    const {recipeId, internalRecipe } = req.body;
    await user_utils.updateLastViewedRecipe(userId, recipeId, internalRecipe);
    await user_utils.addToHistoryRecipes(userId, recipeId, internalRecipe);
    res.status(200).send("Recipe view recorded.");
  } catch (error) {
    next(error);
  }
});
  router.get("/getUserRecipes", async (req, res, next) => {
    try {
      const userId = req.session.user_id;
      const recipes = await user_utils.getUserRecipes(userId);
      const recipesArray = recipes.map((recipe) => ({
        recipeId: recipe.id,
        internalRecipe: true,
        title: recipe.title,
        image: recipe.image,
        readyInMinutes: recipe.readyInMinutes,
        vegan: recipe.vegan,
        vegetarian: recipe.vegetarian,
        glutenFree: recipe.glutenFree,
        popularity: recipe.popularity,
        analyzedInstructions: recipe.analyzedInstructions,
        summary: recipe.summary,
        extendedIngredients: recipe.extendedIngredients,
        servings: recipe.servings
      }));
      const results = await recipe_utils.getRecipesByArray(recipesArray,userId);
      res.send(results);
    } catch (error) {
      next(error);
    }
  });
module.exports = router;
