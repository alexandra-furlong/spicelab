// This will be the object that will contain the Vue attributes
// and be used to initialize it.
let app = {};

// Given an empty app object, initializes it filling its attributes,
// creates a Vue instance, and then initializes the Vue instance.
let init = async(app) => {

    // This is the Vue data.
    app.data = {
        original: [],
        saved: []
    };

    app.user_recipes = async function () {
        try {
            const response = await axios.get("../get_user_recipes");
            app.data.original = response.data.orig_recipes;
            app.data.saved = response.data.saved_recipes;
            console.log(app.data.original, app.data.saved);
        } catch (error) {
            console.error(error);
        }
    }

    app.toggle_save = async function (recipe, event) {
      try {
          event.stopPropagation();
          const response = await axios.post("../save_recipe", {recipe_id: recipe.id});
          
          var tmp = app.data.saved.map(recipe => recipe.id)
          const index = tmp.indexOf(recipe.id);
          if (index !== -1) {
            this.saved.splice(index, 1);
            console.log("deleted");
          } else {
            this.saved.push(recipe);
            console.log("added");
          }
      } catch (error) {
          console.error(error);
      }
    }

    app.initializeScrollAnimation = function (scrollContainerSelector, leftPaddleSelector, rightPaddleSelector, scrollDistance) {
        var scrollContainer = document.querySelector(scrollContainerSelector);
        if (!scrollContainer) {
            return;
        }
        var leftPaddle = document.querySelector(leftPaddleSelector);
        var rightPaddle = document.querySelector(rightPaddleSelector);
        var paddleMargin = 20;
          
        var getMenuWrapperSize = function() {
          return scrollContainer.offsetWidth;
        };
      
        var menuWrapperSize = getMenuWrapperSize();
        window.addEventListener('resize', function() {
          menuWrapperSize = getMenuWrapperSize();
        });
      
        var items = scrollContainer.getElementsByClassName('card');
        console.log(items);
        var itemsLength = items.length;
        console.log(items, items.length);
        var itemSize = items[0].offsetWidth;
        var menuSize = itemsLength * itemSize;
        var menuInvisibleSize = menuSize - menuWrapperSize;
      
        var getMenuPosition = function() {
          return scrollContainer.scrollLeft;
        };
      
        scrollContainer.addEventListener('scroll', function() {
          menuInvisibleSize = menuSize - menuWrapperSize;
          var menuPosition = getMenuPosition();
          var menuEndOffset = menuInvisibleSize - paddleMargin;
      
          if (menuPosition <= paddleMargin) {
            leftPaddle.classList.add('hidden');
            rightPaddle.classList.remove('hidden');
          } else if (menuPosition < menuEndOffset) {
            leftPaddle.classList.remove('hidden');
            rightPaddle.classList.remove('hidden');
          } else if (menuPosition >= menuEndOffset) {
            leftPaddle.classList.remove('hidden');
            rightPaddle.classList.add('hidden');
          }
        });
      
        leftPaddle.addEventListener('click', function() {
          //console.log(getMenuPosition() - scrollDistance);
          scrollContainer.scrollTo({
            left: getMenuPosition() - scrollDistance,
            behavior: 'smooth'
          });
        });
      
        rightPaddle.addEventListener('click', function() {
          scrollContainer.scrollTo({
            left: getMenuPosition() + scrollDistance,
            behavior: 'smooth'
          });
        });
      }

    // This contains all the methods.
    app.methods = {
        // When clicking on recipe name, will load its individual page
        go_to_recipe_page(recipe_id) {
          window.location = "/recipe_app/recipe/" + recipe_id;
        },
        user_recipes: app.user_recipes,
        initializeScrollAnimation: app.initializeScrollAnimation,
        toggle_save: app.toggle_save
    };

    // This creates the Vue instance.
    app.vue = new Vue({
        el: "#user-vue",
        data: app.data,
        methods: app.methods
    });

    // And this initializes it.
    app.init = async () => {
        try {
            await app.vue.user_recipes();
            app.vue.initializeScrollAnimation('.scroll-items-1', '.left-paddle-1', '.right-paddle-1', 700);
            app.vue.initializeScrollAnimation('.scroll-items-2', '.left-paddle-2', '.right-paddle-2', 700);
        } catch (error) {
            console.error(error);
        }
    };

    // Call to the initializer.
    try {
        await app.init();
    } catch (error) {
        console.error(error);
    }
};

// This takes the (empty) app object, and initializes it,
// putting all the code in it. 
init(app);


