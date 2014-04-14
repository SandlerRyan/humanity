from django.db import models

# Create your models here.
class WhiteCard(models.Model):
	content = models.CharField(max_length=511)

class BlackCard(models.Model):
	content = models.CharField(max_length=511)

class UserProfile(models.Model):
	# unique identifier from fb api
	fb_id = models.CharField(max_length=100)
	first = models.CharField(max_length=50)
	last = models.CharField(max_length=50)
