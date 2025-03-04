#SpiceLab

## Emails of all project members:

hye26@ucsc.edu

saponce@ucsc.edu

dafurlon@ucsc.edu



## Description:

This is a recipe app that allows a user to add/edit their own recipes & explore other recipes posted by different users using a filter function with different categories
like "Vegan", "Breakfast", "Italian", etc.


## Main Pages:
- Sign In/Sign Up Page
      - Pretty self-explanatory. Implemented server-side.
- Home Page
      - Explains the website to the user and directs them to either explore recipes or create their own. Contains an animated image that will be coded using Vue/js
- User Recipes Page & "Default" Recipes Page 
      - Two different pages where the user can search through recipes. One is for recipes created by users, while the other is for recipes that are contained in our website or 
      considered admin-published (hence the name "default"). They both function pretty much identially in that the user can enter tags into a search bar (like "Vegan", "Breakfast", "Italian", etc) and the displayed recipes will update without reloading the page to put the ones with the most matching tags first. Implemented using Vue
- Create/Edit Recipes Page
      - Form where user enters info for a new recipe, such as title, the steps, ingredients, and tags. Implemented server-side
- Individual Recipe Page
      - A page that displays the info of a recipe depending on the database ID passed into its URL. Implemented server-side
- Sources/Citations Page 
      - Contains list of where we obtained all of the recipes we will populate the database with, as well as image sources

An interactive prototype is available through our [Figma project](https://www.figma.com/file/ACh4rnOYozh4eFZ3F87sd3/Recipe-Project?type=design&node-id=1%3A296&t=8ji9xMbhzbDQ289x-1), simply click the play icon on the upper right corner to view it properly



## Data Organization:
- User table 
- Recipe table 
- Saved Recipes table
- Hashtags table
- Comments & Ratings table 



## User Stories:

A user can create an account or sign into an existing account. They can view a User Recipes page that displays all the recipes they have created. They are also able to add or edit recipes to that page. Users can explore other recipes on the default recipes page where they can review and comment on them. Users can also search and sort recipes by tags, i.e. vegan, dairy-free, etc.



## Implementation Plan:

Using Asana, tasks are divided among the members based on the priority & predicted difficulty of each task.

May 2 - 7       : Create Prototype Sketches in Figma

May 8 - 14      : Create Database Tables

May 14 - 27     : Create Main Pages 

May 28 - Jun 10 : Work on Extra features
