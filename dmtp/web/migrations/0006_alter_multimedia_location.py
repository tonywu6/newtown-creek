# Generated by Django 3.2.4 on 2021-06-26 17:45

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('web', '0005_auto_20210626_1323'),
    ]

    operations = [
        migrations.AlterField(
            model_name='multimedia',
            name='location',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to='web.location'),
        ),
    ]
