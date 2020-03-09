import logging

from jinja2 import Environment, PackageLoader, select_autoescape


web_env = Environment(
    loader=PackageLoader('dmtp', 'web'),
    autoescape=select_autoescape(['html']),
    trim_blocks=True,
    lstrip_blocks=True,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('dmtp-bauarbeiten')
