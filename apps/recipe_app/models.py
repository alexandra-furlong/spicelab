"""
This file defines the database models
"""

from .common import db, Field, auth
from pydal.validators import *
from pydal.tools.tags import Tags

def get_user_email():
    return auth.current_user.get('email') if auth.current_user else None

def get_username():
    return auth.current_user.get('username') if auth.current_user else None

def get_user_id():
    return auth.current_user.get('id') if auth.current_user else None

db.define_table(
    'recipe',
    Field('title', 'string', requires=IS_NOT_EMPTY()),
    Field('prep_time', 'integer', requires=IS_NOT_EMPTY()),
    Field('cook_time', 'integer', requires=IS_NOT_EMPTY()),
    Field('description', 'text', requires=IS_NOT_EMPTY()),
    Field('ingredients', 'list:string', requires=IS_NOT_EMPTY()),
    Field('directions', 'text', requires=IS_NOT_EMPTY()),
    Field('image', 'upload', label='Recipe Image'),
    Field('credit', 'string'),
    auth.signature,
)

# Recipe tags need to be in format: /<tag_title>/
# (slash on front and back)
recipe_tags = Tags(db.recipe)

db.define_table(
    'saved_recipe',
    Field('user', 'reference auth_user'),
    Field('saved_recipe_id', 'reference recipe')
)

db.commit()
