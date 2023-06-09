"use strict";
//Used by browse_default_recipes.html AND browse_user_recipes

function clone(obj) {
      return JSON.parse(JSON.stringify(obj));
}

function init() {
      var self = {};
      self.data = {};
      self.methods = {};

      self.data.tag = "";
      self.data.search_tags = {}; //Using object to avoid duplicates and have tag names
      self.data.search_tag_names = []; //Keeping this list of tag names because I've seen Vue have trouble with displaying object names before
      self.data.recipes = [];
      self.data.current_page = 1;
      self.data.reached_last_page = true;
      self.data.browsing_user_recipes = false; //True if we are on the "Blog"
      self.data.app_name = "recipe_app";

      if(document.URL.includes("browse_user_recipes"))
            self.data.browsing_user_recipes = true;

      //When user enters a tag in the text box
      self.methods.add_tag = function(){
            var tag_copy = self.data.tag //So we can do whatever we want to the og tag
            tag_copy = tag_copy.toLowerCase()
            tag_copy = tag_copy.replace(/ /g, "-") //Convert tag to lower-case and no spaces
            tag_copy = tag_copy.replace(/_/g, "-")
            tag_copy = tag_copy.replace(/\//g, "");
            console.log("looking for ../tag_in_db/" + tag_copy)
            self.data.tag = ""; //Clear the text box
            //Remember to verify server-side
            axios.get("../tag_in_db/" + tag_copy).then(function(result){
                  if(result.data.tag_in_db === false){
                        console.log(tag_copy + " does not exist in tag database");
                        return;
                  }

                  self.data.search_tags[tag_copy] = true; //Don't understand why result has data
                  self.data.search_tag_names = Object.keys(self.data.search_tags)
                  console.log(self.data.search_tags);

                  //Now send the list of tag ids and return the recipes
                  self.data.current_page = 1;
                  //Resetting page to 1 means the page will be displayed as 1 for a sec while loading the recipes
                  //But not a big deal - is only visual
                  self.methods.load_recipes();
            });
      }

      //Remove tag from both search_tags and search_tag_names, then reload the recipes
      self.methods.remove_tag = function(remove_this){
            if(self.data.search_tags[remove_this]){
                  delete self.data.search_tags[remove_this];
                  self.data.search_tag_names = Object.keys(self.data.search_tags);
                  self.methods.load_recipes();
            }
            else{
                  console.error("Tried to remove a tag that isn't in search_tags");
            }
      }

      self.methods.load_recipes = function(page_num=self.data.current_page){
            console.log("Loading recipes");
            //Tell the recipe loader which page we are loading (including current), and update the page number
            let request_obj = {search_tags: self.data.search_tag_names, page_num:page_num,
                   get_user_recipes:self.data.browsing_user_recipes};
            self.data.current_page = page_num;
            axios.post("../get_recipes_from_search", request_obj).then(function(result){
                  //List of objects...though matches itself is an object

                  self.data.recipes = [];
                  let row = []; //Up to 4
                  for (let recipe of result.data.matches){
                        //I hate the fact that it's "of" instead of "in"...
                        console.log("pushing recipe: " + recipe);
                        row.push(recipe);
                        if(row.length == 4){
                              console.log("making new row");
                              self.data.recipes.push(row);
                              row = [];
                        }
                  }
                  if(row.length > 0){
                        self.data.recipes.push(row);
                  }
                  /*
                  Basically, the recipe list we created for the page:
                  [
                        [recipe, recipe, recipe, recipe]
                        [recipe, recipe, recipe, recipe]
                        [recipe, recipe]
                  ]
                  So we can create the grid-style layout
                  */

                  self.data.reached_last_page = result.data.reached_last_page;
            });
      }

      self.methods.save_recipe = function(row_index, column_index, event){
            event.stopPropagation(); // prevent propagation of click
            let target_recipe = self.data.recipes[row_index][column_index];
            console.log("Saving " + target_recipe.title);
            if(target_recipe){
                  let put_obj = {recipe_id: target_recipe.id};
                  axios.put("../save_recipe", put_obj).then(function(result){
                        if(result.data.user_logged_in){
                              target_recipe.saved = !target_recipe.saved;
                        }
                        else{
                              alert("Please sign in to save recipes");
                              console.log("Can't save - user not logged in");
                        }
                  });
            }
            else{
                  console.error("Save Recipe: Index out of range");
            }
      }

      //When clicking on recipe name, will load its individual page
      self.methods.go_to_recipe_page = function(recipe_id){
            window.location = "/" + self.data.app_name + "/recipe/" + recipe_id;
      }

      //Send the stuff to vue
      self.vue = new Vue({el: '#vue', data: self.data, methods:self.methods});

      //Startup functions
      self.methods.load_recipes();

      return self;
}

window.app = init();