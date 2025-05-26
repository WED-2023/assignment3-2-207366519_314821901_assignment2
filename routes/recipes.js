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
    const recipes = await recipes_utils.getRecipeByText(req.query.query, req.query.number || 5);
    res.send(recipes);
  } catch (error) {
    next(error);
  }
});

/**
 * This path gets recipe data in the body and saves it to the database
 */
router.post("/RecipeDB", async (req, res, next) => {
  try {
    await recipes_utils.addRecipeToDB(req.body);
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

    const recipe = await recipes_utils.getRecipeFromDB(recipeId);
    res.status(200).json(recipe);
  } catch (error) {
    if (error.message === "Recipe not found in DB") {
      res.status(404).send(error.message);
    } else {
      next(error);
    }
  }
});




router.post("/addToViewRecipe", async (req, res, next) => {
  try {
    const { userId, recipeId, internalRecipe } = req.body;
    await recipes_utils.updateLastViewedRecipe(userId, recipeId, internalRecipe);
    res.status(200).send("Recipe view recorded.");
  } catch (error) {
    next(error);
  }
});








module.exports = router;
