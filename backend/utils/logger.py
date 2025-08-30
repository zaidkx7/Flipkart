import logging
from colorama import Fore, Style, init

# Initialize colorama
init(autoreset=True)

class CustomFormatter(logging.Formatter):
    """Custom formatter for adding colors to logs."""
    COLORS = {
        logging.DEBUG: Fore.CYAN,
        logging.INFO: Fore.YELLOW,
        logging.WARNING: Fore.MAGENTA,
        logging.ERROR: Fore.RED,
        logging.CRITICAL: Fore.RED + Style.BRIGHT,
    }

    def format(self, record):
        log_color = self.COLORS.get(record.levelno, "")
        log_message = super().format(record)
        return f"{log_color}{log_message}{Style.RESET_ALL}"

class ModuleLogger(logging.Logger):
    """Custom logger that supports module names."""
    
    def __init__(self, name, module_name=None):
        super().__init__(name)
        self.module_name = module_name or name
    
    def _log(self, level, msg, args, exc_info=None, extra=None, stack_info=False):
        if extra is None:
            extra = {}
        extra['module_name'] = self.module_name
        super()._log(level, msg, args, exc_info, extra, stack_info)

def get_logger(module_name=None):
    """Create and return a logger with colored output and file saving."""
    logger_name = "LOGGER"
    
    # Register our custom logger class
    logging.setLoggerClass(ModuleLogger)
    
    logger = logging.getLogger(logger_name)
    logger.setLevel(logging.DEBUG)
    
    # Set the module name if provided
    if module_name and hasattr(logger, 'module_name'):
        logger.module_name = module_name

    # Check if handlers already exist to prevent duplicates
    if not logger.handlers:
        # Console handler with colors
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.DEBUG)
        console_formatter = CustomFormatter(
            "%(asctime)s - %(module_name)s - %(levelname)s - %(message)s"
        )
        console_handler.setFormatter(console_formatter)

        # Add handlers to the logger
        logger.addHandler(console_handler)

    return logger