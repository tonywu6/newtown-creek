# Generated by Django 3.2.4 on 2021-06-26 16:48

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('web', '0003_alter_multimedia_related'),
    ]

    operations = [
        migrations.AlterField(
            model_name='multimedia',
            name='description',
            field=models.TextField(blank=True),
        ),
        migrations.AlterField(
            model_name='multimedia',
            name='location',
            field=models.ForeignKey(blank=True, on_delete=django.db.models.deletion.CASCADE, to='web.location'),
        ),
    ]
