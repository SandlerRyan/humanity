# -*- coding: utf-8 -*-
from south.utils import datetime_utils as datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding field 'Player.updated_at'
        db.add_column('players', 'updated_at',
                      self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, default=datetime.datetime(2014, 4, 20, 0, 0), blank=True),
                      keep_default=False)

        # Adding field 'Game.updated_at'
        db.add_column('games', 'updated_at',
                      self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, default=datetime.datetime(2014, 4, 20, 0, 0), blank=True),
                      keep_default=False)


    def backwards(self, orm):
        # Deleting field 'Player.updated_at'
        db.delete_column('players', 'updated_at')

        # Deleting field 'Game.updated_at'
        db.delete_column('games', 'updated_at')


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
            'created_at': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'creator': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'creator'", 'to': u"orm['humanity.Player']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'players': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'players'", 'symmetrical': 'False', 'to': u"orm['humanity.Player']"}),
            'started': ('django.db.models.fields.BooleanField', [], {}),
            'updated_at': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'winner': ('django.db.models.fields.related.ForeignKey', [], {'default': 'None', 'related_name': "'winner'", 'null': 'True', 'blank': 'True', 'to': u"orm['humanity.Player']"})
        },
        u'humanity.player': {
            'Meta': {'object_name': 'Player', 'db_table': "'players'"},
            'created_at': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'fb_key': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'first': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'last': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'updated_at': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'})
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