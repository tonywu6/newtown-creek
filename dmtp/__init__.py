import logging
import shutil

from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('dmtp.bauarbeiter')

logger.info('Checking prerequisites ...')
TOOL_AVAILABLE = dict()
for tool, warning in {
    'npx': 'Node.js related functions (such as beautifier and serve) will not be available.',
    'sass': 'Stylesheets will not be compiled.'
}.items():
    available = shutil.which(tool)
    if not available:
        logger.warning(f'{tool} not found on PATH. {warning}')
    else:
        logger.info(f'{tool} ... yes')
    TOOL_AVAILABLE[tool] = available
