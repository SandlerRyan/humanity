***************************************************************
* HARVARD AGAINST HUMANITY
* A Harvard-themed implementation of Cards Against Humanity
* written in Nodejs with the express framework

* Vladimir Bok
* Ian Boothby
* Ryan Sandler
* Nuseir Yassin
***************************************************************


Database Migrations
----------------------------------------------------------------
We use the Bookshelf.js ORM to handle database models within the
app, but the db migrations themselves are created with the Django
framework, which has a more fully-featured handling of models and
migrations.

To run the migrations for this project, first have python 2.7 and
Django 1.6.2 installed (preferably in a virtual environment). Next,
create a mysql database named "humanity." Finally, open the folder
humanity_migrations and run the command

	python manage.py syncdb

to initiate the table. Subsequent migrations can be made using the
South module (which also needs to be installed in your python or
virtualenv site packages). To do so, simply run

	python manage.py migrate humanity

Migration schemas should have already been created by us and added to
version control.

