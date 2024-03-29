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
	fb_key = models.BigIntegerField()
	first = models.CharField(max_length=50)
	last = models.CharField(max_length=50)
	image_url = models.CharField(max_length=200)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now_add=True)

	def __unicode__(self):
		return self.last

	class Meta:
		db_table = 'players'

class Game(models.Model):
	active = models.BooleanField()
	started = models.BooleanField()
	creator = models.ForeignKey(Player, related_name='creator')
	winner = models.ForeignKey(Player, related_name='winner', blank=True, null=True, default=None)
	players = models.ManyToManyField(Player, related_name='players', through='GamePlayer')

	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		db_table = 'games'

class GamePlayer(models.Model):
	player = models.ForeignKey(Player)
	game = models.ForeignKey(Game)
	connected = models.BooleanField()
	socket_id = models.CharField(max_length=20)
	judged = models.BooleanField(default=False)
	class Meta:
		db_table='games_players'

class Turn(models.Model):
	number = models.IntegerField(max_length=2)
	game = models.ForeignKey(Game)
	winner = models.ForeignKey(Player)
	black_card = models.ForeignKey(BlackCard)
	white_card1 = models.ForeignKey(WhiteCard, related_name='whitecard1')
	white_card2 = models.ForeignKey(WhiteCard, null=True, blank=True, related_name='whitecard2')

	def __unicode__(self):
		return self.game_id

	class Meta:
		db_table = 'turns'




