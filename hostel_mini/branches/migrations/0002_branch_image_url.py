from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('branches', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='branch',
            name='image_url',
            field=models.URLField(blank=True, help_text='Đường dẫn ảnh đại diện chi nhánh', max_length=500, null=True),
        ),
    ]
