"""
This module contains the FlipkartApiScraper class, 
which is used to scrape Flipkart products using the API.

supports pagination and saving to database.
"""

import time

from retry import retry
from curl_cffi import requests

from backend.utils.logger import get_logger
from backend.modules.flipkart.main import FlipkartScraper
from backend.utils.cookies_getter import CookiesHeadersGetter

class FlipkartApiScraper(FlipkartScraper):
    BASE_URL: str = "https://1.rome.api.flipkart.com/api/4/page/fetch"
    MODULE: str = 'FLIPKART_API'
    ENABLE_PAGINATION: bool = False

    def __init__(self):
        super().__init__()
        self.client = CookiesHeadersGetter()
        self.cookies = self.client.get_cookies()
        self.headers = self.client.get_headers()
        self.logger = get_logger(self.MODULE)
        self.logger.info('Initializing Flipkart API Scraper...')
    
    @retry(Exception, tries=3, delay=2)
    def get_response(self, query: str) -> dict:
        json_data = {
            'pageUri': '/search?q=%s&otracker=search&otracker1=search&marketplace=FLIPKART&as-show=off&as=off&page=%s' % (query, self.PAGE),
            'pageContext': {
                'fetchSeoData': True,
                'paginatedFetch': True,
                'pageNumber': self.PAGE,
            },
            'requestContext': {
                'type': 'BROWSE_PAGE',
                'ssid': '71zejon5o00000001756378958593',
                'sqid': 'yplr55f5z40000001756413455265',
            },
        }

        response = requests.post(self.BASE_URL, cookies=self.cookies, headers=self.headers, json=json_data)
        if not response.ok:
            raise Exception('Failed to fetch URL: %s Reason: %s' % (self.BASE_URL, response.reason))
        return response.json()
    
    def get_products(self, json_response: dict) -> list:
        PRODUCTS = []
        for slot in json_response['RESPONSE']['slots']:
            if slot['slotType'] == 'WIDGET' and slot['widget']['type'] == 'PRODUCT_SUMMARY':
                PRODUCTS.append(slot['widget']['data']['products'][0]['productInfo']['value'])
        return PRODUCTS
    
    def start(self, query: str):
        response = self.get_response(query)
        products = self.get_products(response)
        for product in products:
            product_details = self.get_product_details(product)
            self.save_to_db(product_details)

    def run(self):
        self.logger.info('Flipkart API Scraper Started')
        query = 'Mobile Phones'
        if self.ENABLE_PAGINATION:
            self.logger.info('PAGINATION ENABLED')
            self.logger.info('Starting from page %s -> %s' % (self.PAGE, self.PAGE + self.MAX_PAGES))
            while self.PAGE <= self.MAX_PAGES:
                self.logger.info('Fetching page %s' % self.PAGE)
                self.start(query)
                self.logger.info('Sleeping for 5 seconds...')
                time.sleep(5)
                self.PAGE += 1
            self.logger.info('All pages fetched')
            self.logger.info('Flipkart API Scraper Completed')
            return
        
        self.logger.info('Getting response for query: %s' % query)
        self.start(query)
        self.logger.info('Flipkart API Scraper Completed')

def run():
    return FlipkartApiScraper()

if __name__ == '__main__':
    run().run()
