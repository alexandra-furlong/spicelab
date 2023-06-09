from py4web import action, request, abort, redirect, URL, HTTP
from yatl.helpers import A
from .common import db, session, T, cache, auth, logger, authenticated, unauthenticated, flash
from .models import recipe_tags, get_user_id, get_username, get_user_email
import re
from py4web.utils.url_signer import URLSigner
import datetime
import functools

url_signer = URLSigner(session)

MAX_RESULTS_PER_PAGE = 8 # Num of recipes displayed per page on recipe browser and blog

@action("browse_default_recipes", method=["GET"])
@action.uses("browse_default_recipes.html", session, auth)
def browse_default_recipes():
    return dict()

#AKA, the "blog"
@action("browse_user_recipes")
@action.uses("browse_user_recipes.html", session, auth)
def browse_user_recipes():
    return dict()

# Saving a recipe
# Need to make sure that user is logged in (Probably redirect them if they are not, or just put an alert)
# If recipe is already saved, unsave.
@action("save_recipe", method=["POST", "PUT"])
@action.uses(db, session, auth)
def save_recipe():
    recipe_id = request.json["recipe_id"]

    if(get_user_id() != None):
        recipe_save = db(db.saved_recipe.user == get_user_id() and db.saved_recipe.saved_recipe_id == recipe_id).select().first()
        if(recipe_save == None):
            print("Saving recipe")
            db.saved_recipe.insert(user=get_user_id(), saved_recipe_id=recipe_id)
        else:
            print("Unsaving recipe")
            db(db.saved_recipe.user == get_user_id() and db.saved_recipe.saved_recipe_id == recipe_id).delete()
        return dict(user_logged_in=True)
    else:
        # User is not logged in and thus cannot save
        return dict(user_logged_in=False)

    

@action("my_recipes")
@action.uses("generic.html", auth.user)
def my_recipes():
    return dict()

# Takes a string and converts it to a tag path if said tag exists
@action("tag_in_db/<tag_string>")
@action.uses(db)
def tag_in_db(tag_string):
    # Note: All tag_strings are converted to lowercase client-side, spaces and underscores replaced with -, slashes are removed
    tag_in_db = db(db.recipe_tag_default.tagpath == ("/" + tag_string + "/")).select().first()
    if(tag_in_db == None):
        print("Tag not in database")
        return dict(tag_in_db=False)
    else:
        print("Found tag " + str(tag_in_db))
        # If we wanted to prevent similar repeat tags, we'd return
        # the tagpath without the slashes
        return dict(tag_in_db=True)

# Recieves list of tags, returns list of recipes that match said tags
# py4web doesn't seem to like doing queries in a non-GET request
@action("get_recipes_from_search", method=["GET", "POST"])
@action.uses(db, auth)
def get_recipes_from_search():
    print("URL:" + str(URL("part1", "part2")))

    search_tags = request.json["search_tags"]
    PAGE = request.json["page_num"]
    get_user_recipes = request.json["get_user_recipes"] # If true, we are on the blog page

    # Knowing if we have reached the farthest possible page for the given tag search?
        # Do another query 1 page ahead and see if it gets anything
    reached_last_page = False

    print("Tag search: " + str(search_tags))
    if(len(search_tags) > 0):
        tag_query = recipe_tags.find(search_tags, mode="and")
        
        # Only return admin-created recipes on browse-recipes
        # Only return non-admin recipes on blog
        if(get_user_recipes):
            user_query = db.recipe.created_by != 1
        else:
            user_query = db.recipe.created_by == 1

        func = lambda a, b: (a & b)
        tag_query = functools.reduce(func, [tag_query, user_query])

        print(tag_query)
        matches = db(tag_query).select(limitby=((PAGE - 1) * MAX_RESULTS_PER_PAGE, PAGE * MAX_RESULTS_PER_PAGE)).as_list()
        
        # Check if we're on the last page
        one_page_ahead = db(tag_query).select(limitby=(PAGE * MAX_RESULTS_PER_PAGE, (PAGE + 1) * MAX_RESULTS_PER_PAGE)).as_list()
    else:
        query = db.recipe.created_by == 1 #1 is the ID of the admin
        if(get_user_recipes):
            query = db.recipe.created_by != 1

        # Reason why join query didn't work before was because I put things in the wrong order
        matches = db(query).select(limitby=((PAGE - 1) * MAX_RESULTS_PER_PAGE, PAGE * MAX_RESULTS_PER_PAGE)).as_list()
        one_page_ahead = db(query).select(limitby=(PAGE * MAX_RESULTS_PER_PAGE, (PAGE + 1) * MAX_RESULTS_PER_PAGE)).as_list()
    
    if(len(one_page_ahead) == 0):
        reached_last_page = True

    # Loops through each recipe and see if the current user has saved it (for properly displaying save button)
    for match in matches:
        # There should only be 1 save of a recipe for the current user
        # The problem is with putting 2 conditions in one query...its returning something even if the user is not logged in
        # I guess this means a join would be useful after all...
        recipe_saved_by_user = False
        for time_recipe_is_saved in db(db.saved_recipe.saved_recipe_id == match["id"]).select():
            if time_recipe_is_saved.user == get_user_id():
                print("Recipe saved by user")
                recipe_saved_by_user = True
        match["saved"] = recipe_saved_by_user
        recipe_author = db(db.auth_user.id == match["created_by"]).select().first()
        if(get_user_recipes):
            match["author_name"] = recipe_author.first_name + " " + recipe_author.last_name
        # Used for displaying tags
        # If the app is too slow, delete this
        match["tags"] = []
        for recipe_tag in db(db.recipe_tag_default.record_id == match["id"]).select(db.recipe_tag_default.tagpath):
            match["tags"].append(recipe_tag.tagpath.strip("/"))
    return dict(matches=matches, reached_last_page=reached_last_page)

# The home page
@action("index")
@action.uses("home.html", auth)
def home():
    message = "Hello from home"
    return dict(message=message)

# Reference to "home" will instead go to index
@action("home")
@action.uses("home.html", auth)
def home():
    redirect("index")
    return

# Creates a "form" to allow users to create their own recipes
@action("create_recipe", method="POST")
@action.uses(db, session, auth.user)
def create_recipe():
    # check if the user is logged in
    if not auth.current_user:
        redirect(URL('auth/login'))  

    data = request.json

    title       = data.get("title")
    prep_time   = data.get("prep_time")
    cook_time   = data.get("cook_time")
    description = data.get("description")
    ingredients = data.get("ingredients")
    directions  = data.get("directions")
    tags        = data.get("tags")
    credit      = data.get("credit")
    image       = data.get("image")

    # if we don't have a title or the list of tags is not a list return 400/this isn't a valid request
    # check that tags is a list
    if not title or not isinstance(tags, list): 
        raise HTTP(400)

    # insert the recipe entry with or without an image 
    if image is not None:
        recipe_id = db.recipe.insert(
            title=title, 
            prep_time=prep_time,
            cook_time=cook_time,
            description=description, 
            ingredients=ingredients,
            directions=directions,
            credit=credit,
            image=image
        )
    else:
        recipe_id = db.recipe.insert(
        title=title, 
        prep_time=prep_time,
        cook_time=cook_time,
        description=description, 
        ingredients=ingredients,
        directions=directions,
        credit=credit,
    )

    # add tags to the recipe entry 
    recipe_tags.add(recipe_id, tags)

    return dict(recipe_id=recipe_id)

# Creates a "form" to allow users to create their own recipes
@action("create_recipe")
@action.uses("create_recipe.html", db, session, auth.user)
def create_recipe():
    # check if the user is logged in
    if not auth.current_user:
        redirect(URL('auth/login'))  

    data = request.json

    # return empty dict for GET 
    if data is None:
        return dict()


    return dict()


@action("user_recipes")
@action.uses("user_recipes.html", auth.user, db)
def user_recipes():
    return dict()

# Gets the recipes created by the user and the ones they've saved
@action("get_user_recipes")
@action.uses(auth.user, db)
def get_user_recipes():
    original = db(db.recipe.created_by == auth.user_id).select().as_list()

    query = (db.saved_recipe.user == auth.user_id)
    saved = db(query).select(db.recipe.ALL, join=db.saved_recipe.on(db.saved_recipe.saved_recipe_id == db.recipe.id)).as_list()
    
    return dict(orig_recipes=original, saved_recipes=saved)


# Displays an individual recipe page 
@action("recipe/<recipe_id>")
@action.uses("recipe.html", db, auth)
def recipe_page(recipe_id):
    # retrieve the recipe from the db based on the recipe_id
    recipe = db.recipe[recipe_id]

    # check if the recipe exists
    if not recipe:
        raise HTTP(404)

    # a regular expression pattern that will parse numbered recipe.directions 
    if recipe.directions is not None:
        pattern = r'(\d+\.\s(?:.|\n)+?)(?=\n\d+\.\s|$)'
        steps = re.findall(pattern, recipe.directions, re.DOTALL)
    else:
        steps = "";

    # tags associated with the recipe
    tags = recipe_tags.get(recipe_id)

    # format date
    created_on = recipe.created_on
    
    if created_on is not None:
        formatted_date = created_on.strftime("%e %B %Y")
    else: 
        formatted_date = "";

    return dict(recipe=recipe, steps=steps, tags=tags, formatted_date=formatted_date)

# Queries for a selected recipe based off the provided recipe_id 
@action("get_recipe")
@action.uses(db, auth)
def get_recipe():
    recipe_id = request.params.get("recipe_id")

    if recipe_id is None:
        return dict()
    
    # query for the recipe
    recipe = db.recipe[recipe_id]

    current_user_id = get_user_id()

    # query for the tags of the recipe
    tags = recipe_tags.get(recipe_id)
    
    return dict(recipe=recipe, tags=tags, current_user_id=current_user_id)

# Edits an existing recipe & verifies the logged-in user originally created the recipe 
@action("edit_recipe/<recipe_id>", method=["POST", "GET"])
@action.uses("edit_recipe.html", db, auth.user)
def edit_recipe(recipe_id):
    # check if the user is logged in
    if not auth.current_user:
        redirect(URL('auth/login'))  

    # retrieve the recipe from the database based on the recipe id
    recipe = db.recipe[recipe_id]

    # check if the recipe exists
    if not recipe:
        raise HTTP(404)

    # check if the user owns the recipe they are trying to edit
    if recipe.created_by != get_user_id():
        raise HTTP(403)  

    return dict(recipe=recipe)

# Deletes a recipe that matches the provided recipe_id
@action("delete_recipe", method="DELETE")
@action.uses(db, auth.user)
def delete_recipe():
    # parse request data
    recipe_id = request.params.get("recipe_id")

    # check if the user is logged in
    if not auth.current_user:
        redirect(URL('auth/login'))  

    # retrieve the recipe from the database based on the recipe id
    recipe = db.recipe[recipe_id]

    # check if the recipe exists
    if not recipe:
        raise HTTP(404)
    
    # check if the user owns the recipe they are trying to delete
    if recipe.created_by != get_user_id():
        raise HTTP(403)  

    # delete all tags associated with the recipe if they exist 
    tags = recipe_tags.get(recipe_id)
    if tags:
        recipe_tags.remove(recipe_id, tags)

    # delete all saved recipe entries of the recipe if they exists
    saved_recipe_entries = db(db.saved_recipe.saved_recipe_id == recipe_id).select()
    if saved_recipe_entries:
        db(db.saved_recipe.saved_recipe_id == recipe_id).delete()
    
    # delete the recipe itself
    db(db.recipe.id == recipe_id).delete()

    return "deleted."

@action("update_recipe", method=["POST","PUT"])
@action.uses(db, session, auth.user)
def update_recipe():
    # check if the user is logged in
    if not auth.current_user:
        redirect(URL('auth/login'))  

    data = request.json

    # return empty dict for GET 
    if data is None:
        return dict()

    recipe_id   = data.get("recipe_id")
    title       = data.get("title")
    prep_time   = data.get("prep_time")
    cook_time   = data.get("cook_time")
    description = data.get("description")
    ingredients = data.get("ingredients")
    directions  = data.get("directions")
    tags        = data.get("tags")
    credit      = data.get("credit")
    image       = data.get("image")

    # if we don't have a title or the list of tags is not a list return 400/this isn't a valid request
    # check that tags is a list
    if not title or not isinstance(tags, list): raise HTTP(400)

    # insert the recipe entry with or without an image 
    db(db.recipe.id == recipe_id).update(
        title       = title,
        prep_time   = prep_time,
        cook_time   = cook_time,
        description = description, 
        ingredients = ingredients,
        directions  = directions,
        credit      = credit,
        image       = image
    )

    # delete old tags associated with the recipe if they exist 
    old_tags = recipe_tags.get(recipe_id)
    if old_tags:
        recipe_tags.remove(recipe_id, old_tags)

    # add new tags to the recipe entry 
    recipe_tags.add(recipe_id, tags)
    
    return "updated."
