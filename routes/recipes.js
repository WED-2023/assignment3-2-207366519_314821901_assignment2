var express = require("express");
var router = express.Router();
const recipes_utils = require("./utils/recipes_utils");

router.get("/", (req, res) => res.send("im here"));

router.get("/random", async (req, res, next) => {
  try {
    const recipes = await recipes_utils.getRandomRecipes();
    res.send(recipes);
  } catch (error) {
    next(error);
  }
});

/**
 * This path returns a full details of a recipe by its id
 */
router.get("/searchById/:recipeId", async (req, res, next) => {
  try {
    const recipe = await recipes_utils.getRecipeDetails(req.params.recipeId);
    res.send(recipe);
  } catch (error) {
    next(error);
  }
});

router.get("/search", async (req, res, next) => { 
  try {
    const recipes = await recipes_utils.getRecipeByText(req.query.query, req.query.number || 5, req.query.cuisine, req.query.diet, req.query.intolerance);
    res.send(recipes);
  } catch (error) {
    next(error);
  }
});

/**
 * This path gets recipe data in the body and saves it to the database
 */





router.post("/addToViewRecipe", async (req, res, next) => {
  try {
    const userId = req.session.user_id;
    const {recipeId, internalRecipe } = req.body;
    await recipes_utils.updateLastViewedRecipe(userId, recipeId, internalRecipe);
    res.status(200).send("Recipe view recorded.");
  } catch (error) {
    next(error);
  }
});

router.get("/getLastViewedRecipes", async (req, res, next) => {
  try {
    const userId = req.session.user_id;

    // Fetch the last 3 viewed recipes for this user
    const lastViewed = await recipes_utils.getLastViewedRecipes(userId);
    res.status(200).json(lastViewed);
  } catch (error) {
    next(error);
  }
});

//TODO- In the frontend we need to intergrate the users likes with the spooncular likes
router.get("/recipeLikes", async (req, res, next) => {
  try {
    const recipeId = req.query.recipeId;
    const likes = await recipes_utils.getRecipeLikes(recipeId);
    res.status(200).send({ likes });
  } catch (error) {
    next(error);
  }
}
)

module.exports = router;
