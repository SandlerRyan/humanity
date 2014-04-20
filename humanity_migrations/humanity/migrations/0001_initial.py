# -*- coding: utf-8 -*-
from south.utils import datetime_utils as datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'WhiteCard'
        db.create_table('whitecards', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('content', self.gf('django.db.models.fields.CharField')(max_length=511)),
        ))
        db.send_create_signal(u'humanity', ['WhiteCard'])

        # Adding model 'BlackCard'
        db.create_table('blackcards', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('content', self.gf('django.db.models.fields.CharField')(max_length=511)),
            ('blanks', self.gf('django.db.models.fields.IntegerField')(max_length=1)),
        ))
        db.send_create_signal(u'humanity', ['BlackCard'])

        # Adding model 'Player'
        db.create_table('players', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('fb_key', self.gf('django.db.models.fields.CharField')(max_length=100)),
            ('first', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('last', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('created', self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, blank=True)),
        ))
        db.send_create_signal(u'humanity', ['Player'])

        # Adding model 'Game'
        db.create_table('games', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('active', self.gf('django.db.models.fields.BooleanField')()),
            ('started', self.gf('django.db.models.fields.BooleanField')()),
            ('created', self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, blank=True)),
            ('winner', self.gf('django.db.models.fields.related.ForeignKey')(related_name='game_winner', to=orm['humanity.Player'])),
        ))
        db.send_create_signal(u'humanity', ['Game'])

        # Adding M2M table for field players on 'Game'
        m2m_table_name = db.shorten_name('games_players')
        db.create_table(m2m_table_name, (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('game', models.ForeignKey(orm[u'humanity.game'], null=False)),
            ('player', models.ForeignKey(orm[u'humanity.player'], null=False))
        ))
        db.create_unique(m2m_table_name, ['game_id', 'player_id'])

        # Adding model 'Turn'
        db.create_table('turns', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('number', self.gf('django.db.models.fields.IntegerField')(max_length=2)),
            ('game', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['humanity.Game'])),
            ('black_card', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['humanity.BlackCard'])),
            ('white_card1', self.gf('django.db.models.fields.related.ForeignKey')(related_name='whitecard1', to=orm['humanity.WhiteCard'])),
            ('white_card2', self.gf('django.db.models.fields.related.ForeignKey')(blank=True, related_name='whitecard2', null=True, to=orm['humanity.WhiteCard'])),
        ))
        db.send_create_signal(u'humanity', ['Turn'])


    def backwards(self, orm):
        # Deleting model 'WhiteCard'
        db.delete_table('whitecards')

        # Deleting model 'BlackCard'
        db.delete_table('blackcards')

        # Deleting model 'Player'
        db.delete_table('players')

        # Deleting model 'Game'
        db.delete_table('games')

        # Removing M2M table for field players on 'Game'
        db.delete_table(db.shorten_name('games_players'))

        # Deleting model 'Turn'
        db.delete_table('turns')


    models = {
        u'humanity.blackcard': {
            'Meta': {'object_name': 'BlackCard', 'db_table': "'blackcards'"},
            'blanks': ('django.db.models.fields.IntegerField', [], {'max_length': '1'}),
            'content': ('django.db.models.fields.CharField', [], {'max_length': '511'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'})
        },
        u'humanity.game': {
            'Meta': {'object_name': 'Game', 'db_table': "'games'"},
            'active': ('django.db.models.fields.BooleanField', [], {}),
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'players': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'game_players'", 'symmetrical': 'False', 'to': u"orm['humanity.Player']"}),
            'started': ('django.db.models.fields.BooleanField', [], {}),
            'winner': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'game_winner'", 'to': u"orm['humanity.Player']"})
        },
        u'humanity.player': {
            'Meta': {'object_name': 'Player', 'db_table': "'players'"},
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'fb_key': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'first': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'last': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        },
        u'humanity.turn': {
            'Meta': {'object_name': 'Turn', 'db_table': "'turns'"},
            'black_card': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['humanity.BlackCard']"}),
            'game': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['humanity.Game']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'number': ('django.db.models.fields.IntegerField', [], {'max_length': '2'}),
            'white_card1': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'whitecard1'", 'to': u"orm['humanity.WhiteCard']"}),
            'white_card2': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'whitecard2'", 'null': 'True', 'to': u"orm['humanity.WhiteCard']"})
        },
        u'humanity.whitecard': {
            'Meta': {'object_name': 'WhiteCard', 'db_table': "'whitecards'"},
            'content': ('django.db.models.fields.CharField', [], {'max_length': '511'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'})
        }
    }

    complete_apps = ['humanity']