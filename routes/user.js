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
    console.log("User ID:", user_id); 
    const favorites = await user_utils.getFavoriteRecipes(user_id);
    const results = await recipe_utils.getRecipesByArray(favorites);
    res.status(200).json(results);
  } catch(error){
    next(error); 
  }
});

router.delete("/remove", async (req, res, next) => {
  try {
    const userId = req.session.user_id;
    const { recipeId } = req.body;

    if (!recipeId) {
      return res.status(400).send("Missing recipeId");
    }

    await user_utils.removeFavoriteRecipe(userId, recipeId);
    res.status(200).send("Recipe removed from favorites");
  } catch (err) {
    next(err);
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

module.exports = router;
