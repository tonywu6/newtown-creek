from dmtp.utils.logger import config_logging, make_logging_config

from .common import *  # noqa: F403, F401
from .common import APP_NAME

DEBUG = True
config_logging(make_logging_config(APP_NAME, level=10))
