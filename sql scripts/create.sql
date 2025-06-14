USE `webprograming3.2`;

CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  firstname VARCHAR(50) NOT NULL,
  lastname VARCHAR(50) NOT NULL,
  country VARCHAR(50) NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
);


create table if not exists receipes (
    id int primary key,
    title varchar(255) not null,
    image varchar(255) not null,
    readyInMinutes int not null,
    vegan boolean not null,
    vegetarian boolean not null,
    glutenFree boolean not null,
    popularity int not null default 0,
    instructions text not null,
    summary text not null,
    sourceName varchar(255) not null,
    extendedIngredients text not null,
    servings int not null
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
  user_id INT NOT NULL,
  recipe_id INT NOT NULL,
  familyowner VARCHAR(100) NOT NULL,
  whenmade VARCHAR(100) NOT NULL,
  PRIMARY KEY (user_id, recipe_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (recipe_id) REFERENCES receipes(id)
);

CREATE TABLE IF NOT EXISTS likes(
  user_id INT NOT NULL,
  recipe_id INT NOT NULL,
  PRIMARY KEY (user_id, recipe_id)
);


