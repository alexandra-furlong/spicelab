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

    // data for the recipe 
    self.data.recipe          = {};
    self.data.recipe_id       = recipe_id;
    self.data.recipe_credit   = ""; 
    self.data.recipe_img      = null; 
    self.data.saved           = false;
    self.data.owner           = false;

    // retrieves the recipe data 
    self.methods.get_recipe = function(recipe_id){

        // get request to get the recipe object
        axios.get("../get_recipe", {params: {recipe_id: recipe_id}}).then(function(result){
            self.data.recipe        = result.data.recipe;
            self.data.recipe_credit = result.data.recipe.credit;
            self.data.recipe_img    = result.data.recipe.image;

            if(result.data.recipe.created_by == result.data.current_user_id){
                self.data.owner = true;
            }
        });
    }

    // call get_recipe at the beginning
    self.methods.get_recipe(self.data.recipe_id);

    // toggles the saved reciped icon/button & updates the saved recipe db table
    self.methods.save_recipe = function(){
        let id = self.data.recipe_id;

        if(id){
                let put_obj = {recipe_id: id};
                axios.put("../save_recipe", put_obj).then(function(result){
                    if(result.data.user_logged_in){
                            self.data.saved = !self.data.saved;
                    }
                    else{
                            alert("Please sign in to save recipes.");
                    }
                });
        }
        else{
                console.error("save recipe: index out of range");
        }
    }

    // redirects user to the edit page
    self.methods.edit_recipe = function(){
        window.location.href = "../../recipe_app/edit_recipe/" + self.data.recipe_id;
    }

    // deletes the recipe & redirects user to their recipes
    self.methods.delete_recipe = function(){
        axios.delete("../delete_recipe", {params: {recipe_id: recipe_id}}).then(function(){
            window.location.href = "../../recipe_app/user_recipes";
        }); 
    }

    self.vue = new Vue({el:"#vue", "data": self.data, "methods": self.methods});

    return self;
}

window.app = init();