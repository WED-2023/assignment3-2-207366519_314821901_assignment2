USE `webprograming3.2`;

CREATE TABLE IF NOT EXISTS users (
  username VARCHAR(50) PRIMARY KEY,
  firstname VARCHAR(50) NOT NULL,
  lastname VARCHAR(50) NOT NULL,
  country VARCHAR(50) NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  profilePic VARCHAR(255)
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
