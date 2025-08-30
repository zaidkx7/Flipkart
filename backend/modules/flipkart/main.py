"""
This module contains the FlipkartScraper class, 
which is used to scrape Flipkart products using the search URL with BeautifulSoup.

supports pagination and saving to database.
"""

import os
import time
import json

from retry import retry
from bs4 import BeautifulSoup
from curl_cffi import requests
from urllib.parse import urljoin

from backend.utils.logger import get_logger
from backend.alchemy.database import MysqlConnection

class FlipkartScraper:
    BASE_URL: str = "https://www.flipkart.com/"
    MODULE: str = 'FLIPKART'
    SEARCH_URL: str = urljoin(BASE_URL, "search")
    FILES_DIR: str = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'files')
    if not os.path.exists(FILES_DIR):
        os.makedirs(FILES_DIR)
    ENABLE_PAGINATION: bool = True
    MAX_PAGES: int = 10
    PAGE: int = 1
    
    def __init__(self):
        self.logger = get_logger(self.MODULE)
        self.logger.info('Initializing Flipkart Scraper...')
        self.mysql: MysqlConnection = MysqlConnection()

    @retry(Exception, tries=3, delay=2)
    def get_response(self, url: str, query: str = None) -> requests.Response:
        params = {
            'q': query,
            'otracker': 'search',
            'otracker1': 'search',
            'marketplace': 'FLIPKART',
            'as-show': 'off',
            'as': 'off',
            'page': self.PAGE
        }
        response = requests.get(url, params=params)
        if not response.ok:
            raise Exception('Failed to fetch URL: %s Reason: %s' % (url, response.reason))
        
        return response
    
    def get_json_response(self, soup: BeautifulSoup) -> dict:
        script = soup.find('script', id='is_script')
        if script:
            try:
                script_text = script.string.replace('window.__INITIAL_STATE__ = ', '').rstrip(';')
                return json.loads(script_text)
            except json.JSONDecodeError:
                self.logger.error('Failed to parse JSON data: %s' % script_text)
                return {}
        self.logger.error('No script found with id: is_script')
        return {}
    
    def get_products(self, json_response: dict) -> list:
        PRODUCTS = []
        for item in json_response['pageDataV4']['page']['data'].values():
            for slot in item:
                if slot['slotType'] == 'WIDGET' and slot['widget']['type'] == 'PRODUCT_SUMMARY':
                    PRODUCTS.append(slot['widget']['data']['products'][0]['productInfo']['value'])
        return PRODUCTS


    def get_product_details(self, product: dict) -> dict:
        return {
            'product_id': product['id'],
            'title': product['titles']['title'],
            'url': urljoin(self.BASE_URL, product['baseUrl']),
            'rating': product['rating'],
            'specifications': product['keySpecs'],
            'media': [img['url'] for img in product['media']['images']],
            'pricing': product['pricing'],
            'category': product['vertical'],
            'warrantySummary': product['warrantySummary'],
            'availability': product['availability']['displayState'],
            'source': 'flipkart',
        }
    
    def save_to_json(self, data: dict, filename: str):
        with open(f'{self.FILES_DIR}/{filename}.json', 'w') as f:
            json.dump(data, f, indent=4)

    def save_to_db(self, product_details: dict):
        if not self.mysql.exists(product_details['product_id']):
            self.mysql.insert(product_details)
            self.logger.info('Product details for %s saved to database' % product_details['title'])
        else:
            self.logger.info('Product details for %s already exists in database' % product_details['title'])
            self.logger.info('Skipping...')

    def start(self, query: str):
        response = self.get_response(self.SEARCH_URL, query)
        soup = BeautifulSoup(response.text, 'html.parser')
        self.logger.info('Getting JSON response')
        json_response = self.get_json_response(soup)
        products = self.get_products(json_response)
        for product in products:
            product_details = self.get_product_details(product)
            self.save_to_db(product_details)

    def run(self):
        self.logger.info('Starting Flipkart Scraper...')
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
            self.logger.info('All products saved to database')
            self.logger.info('Flipkart Scraper Completed')
            return

        self.start(query)        
        self.logger.info('All products saved to database')
        self.logger.info('Flipkart Scraper Completed')

def run():
    return FlipkartScraper()

if __name__ == '__main__':
    run().run()
    