"use strict";

// get the current URL & parse to get the recipe id
const current_url = window.location.href;
const recipe_id   = current_url.split('/').pop();

function clone(obj) {
      return JSON.parse(JSON.stringify(obj));
}

function init() {
      console.log("test!");
      var self     = {};
      self.data    = {};
      self.methods = {};

      // recipe data 
      self.data.recipe_id            = recipe_id;
      self.data.recipe               = {};
      self.data.tags                 = [];
      self.data.new_tag              = ""; 
      self.data.original_ingredients = [];
      self.data.original_img         = [];
      self.data.img_changed          = false;


      // get the recipe & set the fields 
      self.methods.get_recipe = function(recipe_id){
            axios.get("../get_recipe", {params: {recipe_id: recipe_id}}).then(function(result){
                  self.data.recipe               = result.data.recipe;
                  self.data.tags                 = result.data.tags;
                  self.data.original_ingredients = self.data.recipe.ingredients;
                  self.data.original_img         = self.data.recipe.image;

                  // convert the ingredient array to a newline-separated string
                  var ingredients_string = result.data.recipe.ingredients.join('\n');

                  // assign the newline-separated string to the textarea value
                  self.data.recipe.ingredients = ingredients_string;
            });
      }

      // call get_recipe at the beginning
      self.methods.get_recipe(self.data.recipe_id);

      // uploads an image & saves it as a data URL
      self.methods.upload_file = function(event){
            let input = event.target;
            let file = input.files[0];

            if(file){
                  let reader = new FileReader();
                  reader.addEventListener("load", function (){
                        // set image fields 
                        self.vue.recipe.image = {
                              file: file,
                              name: file.name,
                              url: reader.result
                        };
                  });
                  reader.readAsDataURL(file);
                  self.vue.img_changed = true;
            }
      }
      
      // adds new tags a user has entered
      self.methods.add_tag = function(){
            console.log("adding this tag: " + self.data.new_tag);

            // add new tag to the list of existing tags
            self.data.tags.push(self.data.new_tag.toLowerCase());

            // clear this field so the user can enter a new tag 
            self.data.new_tag = "";
      }

      // removes tags a user has selected
      self.methods.remove_tag = function(tag){
            console.log("removing this tag: " + tag);

            let index = self.data.tags.indexOf(tag);

            if(index != -1){
                  self.data.tags.splice(index, 1);
            }
      }

      // put request to update the recipe entry 
      self.methods.update_recipe = function(){
            // make sure the user filled out all the required fields 
            if (
                  !self.vue.recipe.title ||
                  !self.vue.recipe.prep_time ||
                  !self.vue.recipe.cook_time ||
                  !self.vue.recipe.description ||
                  !self.vue.recipe.ingredients ||
                  !self.vue.recipe.directions
            ) {
                  alert("Please fill out all fields before submitting.");
                  return;
            }

            // split the ingredients separated by comma only if ingredients have been updated
            if(self.vue.original_ingredients == self.vue.recipe.ingredients){
                  var ingredients = self.vue.original_ingredients;
            }
            else { 
                  var ingredients = self.vue.recipe.ingredients.split('\n'); 
            }
            // check if image has been updated
            if(!self.vue.img_changed){
                  var image_url = self.vue.original_img;
            }
            else{
                  var image_url = self.vue.recipe.image && self.vue.recipe.image.url ? self.vue.recipe.image.url : null;
            }

            var data = {
                  "recipe_id": recipe_id,
                  "title": self.vue.recipe.title,
                  "prep_time": self.vue.recipe.prep_time,
                  "cook_time": self.vue.recipe.cook_time,
                  "description": self.vue.recipe.description,
                  "ingredients": ingredients,
                  "directions": self.vue.recipe.directions,
                  "credit": self.vue.recipe.credit,
                  "image": image_url,
                  "tags": self.vue.tags,
            };
            
            console.log(data);
            axios.put("../update_recipe", data).then(function(){
                  // redirect user to the individual recipe page to display the updated recipe
                  window.location.href = "../../recipe_app/recipe/" + recipe_id;
            }, function(){
                  // put request failed, rip
                  alert("Sorry unable to record it!");            
            });

      }

      self.vue = new Vue({el:"#vue", "data": self.data, "methods": self.methods});

      return self;
}

window.app = init();