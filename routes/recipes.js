var express = require("express");
var router = express.Router();
const recipes_utils = require("./utils/recipes_utils");

router.get("/", (req, res) => res.send("im here"));

router.get("/random", async (req, res, next) => {
  console.log("enterd to random recipes first");
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
router.post("/addRecipe", async (req, res, next) => {
  try {
    await recipes_utils.addRecipe(req.body);
    res.status(201).send("Recipe successfully added to database");
  } catch (error) {
    next(error);
  }
});

module.exports = router;
