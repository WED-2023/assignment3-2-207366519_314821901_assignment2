var express = require("express");
var router = express.Router();
const recipes_utils = require("./utils/recipes_utils");
const e = require("express");

router.get("/", (req, res) => res.send("im here"));

router.get("/random", async (req, res, next) => {
  try {
    const recipes = await recipes_utils.getRandomRecipes(req.session.user_id || 0);
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
    const recipe = await recipes_utils.getRecipeDetails(req.params.recipeId, req.session.user_id);
    res.send(recipe);
  } catch (error) {
    next(error);
  }
});

router.get("/search", async (req, res, next) => { 
  try {
    const recipes = await recipes_utils.getRecipeByText(req.session.user_id || 0,req.query.query, req.query.number || 5, req.query.cuisine, req.query.diet, req.query.intolerance);
    res.send(recipes);
  } catch (error) {
    next(error);
  }
});

/**
 * This path gets recipe data in the body and saves it to the database
 */


//TODO- In the frontend we need to intergrate the users likes with the spooncular likes
router.get("/like", async (req, res, next) => {
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
