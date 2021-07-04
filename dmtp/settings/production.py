from dmtp.utils.logger import config_logging, make_logging_config

from .common import *  # noqa: F403, F401
from .common import APP_NAME, secrets_conf

ALLOWED_HOSTS = ['localhost']

DEBUG = False
config_logging(make_logging_config(APP_NAME, level=20))

DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'

AWS_ACCESS_KEY_ID = secrets_conf('AWS_ACCESS_ID')
AWS_SECRET_ACCESS_KEY = secrets_conf('AWS_ACCESS_KEY')

AWS_STORAGE_BUCKET_NAME = 'dmtp-s20'
AWS_S3_REGION_NAME = 'us-west-1'
AWS_DEFAULT_ACL = 'public-read'

AWS_S3_CUSTOM_DOMAIN = f'{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com'
AWS_S3_OBJECT_PARAMETERS = {'CacheControl': 'max-age=86400'}

AWS_LOCATION = 'static'
STATIC_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/{AWS_LOCATION}/'
