"use strict";

function clone(obj) {
      return JSON.parse(JSON.stringify(obj));
}

function init() {
      console.log("test!");
      var self     = [];
      self.data    = {};
      self.methods = {};

      // data 
      self.data.new_tag   = "";
      self.data.tags      = [];
      self.data.recipe_id = null;
      
      self.data.new_recipe = {
            "title": "",
            "prep_time": "",
            "cook_time": "",
            "description": "",
            "ingredients": [],
            "directions": "",
            "credit": "",
            "image": null,
            "tags": "[]"
      };


      // uploads an image & converts it to a data URL
      self.methods.upload_file = function(event){
            let input = event.target;
            let file = input.files[0];

            if(file){
                  let reader = new FileReader();
                  reader.addEventListener("load", function (){
                        // set image fields 
                        self.vue.new_recipe.image = {
                              file: file,
                              name: file.name,
                              url: reader.result
                        };
                  });
                  reader.readAsDataURL(file);
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
      
      // makes a post request to create a new recipe entry 
      self.methods.post_new_recipe = function() {
            // make sure the user filled out all the required fields 
            if (
                  !self.vue.new_recipe.title ||
                  !self.vue.new_recipe.prep_time ||
                  !self.vue.new_recipe.cook_time ||
                  !self.vue.new_recipe.description ||
                  !self.vue.new_recipe.ingredients ||
                  !self.vue.new_recipe.directions
            ) {
                  alert("Please fill out all fields before submitting.");
                  return;
            }

            // split the ingredients separated by comma
            var ingredients = self.vue.new_recipe.ingredients.split('\n');

            // check if image.url is set to null, if not set image_url 
            var image_url = self.vue.new_recipe.image && self.vue.new_recipe.image.url ? self.vue.new_recipe.image.url : null;

            var data = {
                  "title": self.vue.new_recipe.title,
                  "prep_time": self.vue.new_recipe.prep_time,
                  "cook_time": self.vue.new_recipe.cook_time,
                  "description": self.vue.new_recipe.description,
                  "ingredients": ingredients,
                  "directions": self.vue.new_recipe.directions,
                  "credit": self.vue.new_recipe.credit,
                  "image": image_url,
                  "tags": self.vue.tags,
            };

            // clear recipe fields 
            self.vue.new_recipe.title       = "";
            self.vue.new_recipe.prep_time   = "";
            self.vue.new_recipe.cook_time   = "";
            self.vue.new_recipe.description = "";
            self.vue.new_recipe.ingredients = [];
            self.vue.new_recipe.directions  = "";
            self.vue.new_recipe.credit      = "";
            self.vue.new_recipe.image       = null;
            self.vue.new_recipe.tags        = "[]";
            
            console.log(data);
            axios.post("../create_recipe", data).then(function(result){
                  // redirect user to the newly created recipe page
                  self.data.recipe_id = result.data.recipe_id;
                  window.location.href = "../../recipe_app/recipe/" + self.data.recipe_id;
            }); 
      }

      self.vue = new Vue({el:"#vue", "data": self.data, "methods": self.methods});
      console.log("test!");

      return self;
}

window.app = init();