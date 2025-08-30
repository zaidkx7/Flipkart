"""
A Dynamic and Unique approach to get cookies and headers from any website using Selenium headless Browser without getting blocked.

supports any website
parameters:
- url: the website url to get cookies and headers from
- headless: if True, the browser will run in headless mode
"""

import time

from selenium import webdriver
from backend.utils.logger import get_logger
from selenium.webdriver.chrome.options import Options

class CookiesHeadersGetter:
    BASE_URL: str = "https://www.flipkart.com/"
    MODULE: str = 'COOKIES_HEADERS_GETTER'
    
    def __init__(self, url: str = BASE_URL, headless: bool = True):
        self.logger = get_logger(self.MODULE)
        self.BASE_URL = url
        self.HEADLESS = headless

    def get_cookies(self) -> dict:
        
        chrome_options = Options()
        if self.HEADLESS:
            chrome_options.add_argument("--headless")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--window-size=1920,1080")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36")

        driver = webdriver.Chrome(options=chrome_options)

        try:
            driver.get(self.BASE_URL)
            time.sleep(3)
            
            self.logger.info('Trying to get cookies from %s' % self.BASE_URL)
            selenium_cookies = driver.get_cookies()
            cookies_dict = {cookie['name']: cookie['value'] for cookie in selenium_cookies}
            self.logger.info('Got cookies from %s' % self.BASE_URL)

            return cookies_dict
        finally:
            driver.quit()

    def get_headers(self) -> dict:
        self.logger.info('Trying to get headers from %s' % self.BASE_URL)
        self.logger.info('Got headers from %s' % self.BASE_URL)
        return {
                'Accept': '*/*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Connection': 'keep-alive',
                'Content-Type': 'application/json',
                'Origin': self.BASE_URL,
                'Referer': self.BASE_URL,
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-site',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
                'X-User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 FKUA/website/42/website/Desktop',
        }
