from django.db import models

# Create your models here.
class WhiteCard(models.Model):
	content = models.CharField(max_length=511)

	def __unicode__(self):
		return self.content

	class Meta:
		db_table = 'whitecards'


class BlackCard(models.Model):
	content = models.CharField(max_length=511)
	# how many blanks in the sentence to fill in with white cards
	blanks = models.IntegerField(max_length=1)

	def __unicode__(self):
		return self.content

	class Meta:
		db_table = 'blackcards'


class Player(models.Model):
	# unique identifier from fb api
	fb_key = models.CharField(max_length=100)
	first = models.CharField(max_length=50)
	last = models.CharField(max_length=50)
	created = models.DateTimeField(auto_now_add=True)

	def __unicode__(self):
		return self.last

	class Meta:
		db_table = 'players'

class Game(models.Model):
	active = models.BooleanField()
	created = models.DateTimeField(auto_now_add=True)
	winner = models.ForeignKey(Player, related_name='game_winner')
	players = models.ManyToManyField(Player, related_name='game_players')

	class Meta:
		db_table = 'games'

class Turn(models.Model):
	number = models.IntegerField(max_length=2)
	game = models.ForeignKey(Game)
	black_card = models.ForeignKey(BlackCard)
	white_card1 = models.ForeignKey(WhiteCard, related_name='whitecard1')
	white_card2 = models.ForeignKey(WhiteCard, null=True, blank=True, related_name='whitecard2')

	def __unicode__(self):
		return self.game_id

	class Meta:
		db_table = 'turns'



