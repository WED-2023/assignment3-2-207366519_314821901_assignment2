USE `mydb`;

CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  firstname VARCHAR(50) NOT NULL,
  lastname VARCHAR(50) NOT NULL,
  country VARCHAR(50) NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE
  );


CREATE TABLE IF NOT EXISTS receipes (
    id INT AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    image VARCHAR(255) NOT NULL,
    readyInMinutes INT NOT NULL,
    vegan BOOLEAN NOT NULL,
    vegetarian BOOLEAN NOT NULL,
    glutenFree BOOLEAN NOT NULL,
    popularity INT NOT NULL DEFAULT 0,
    analyzedInstructions TEXT NOT NULL,
    summary TEXT NOT NULL,
    userId INT NOT NULL,
    extendedIngredients TEXT NOT NULL,
    servings INT NOT NULL,
    PRIMARY KEY (id, userId)
);

create table if not exists lastViewRecipes (
    userId varchar(50) not null,
    recipeId int not null,
    lastView TIMESTAMP DEFAULT NOW(),
    internalRecipe boolean not null,
    PRIMARY KEY (userId, recipeId,internalRecipe)
);

create table if not exists favoriteRecipes (
    userId varchar(50) not null,
    recipeId int not null,
    internalRecipe boolean not null,
    PRIMARY KEY (userId, recipeId,internalRecipe)
);



create table if not exists historyviewrecipes (
    userId varchar(50) not null,
    recipeId int not null,
    internalRecipe boolean not null,
    PRIMARY KEY (userId, recipeId,internalRecipe)
);

CREATE TABLE IF NOT EXISTS family_recipes(
  recipe_id INT NOT NULL,
  PRIMARY KEY (recipe_id)
);

CREATE TABLE IF NOT EXISTS likes(
  user_id INT NOT NULL,
  recipe_id INT NOT NULL,
  PRIMARY KEY (user_id, recipe_id)
);


