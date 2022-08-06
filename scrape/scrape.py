from datetime import datetime
import json
import random
import re
import scrapy
from scrapy import Request


MIN_OLD_DATE = datetime(2022, 4, 6)
MAX_OLD_DATE = datetime(2022, 4, 20)
MIN_NEW_DATE = datetime(2022, 7, 4)
MAX_NEW_DATE = datetime(2022, 7, 18)
IMGS_LIMIT_PER_TYPE = 500
OPENAI_REGEX = re.compile('^https:\/\/labs\.openai\.com\/s\/.{24}$')
TITLE_REGEX = re.compile('<meta property="og:title" content="([^"]*)"')
IMG_URL_REGEX = re.compile('<meta property="og:image" content="([^"]*)"')


def is_valid_data(data):
    url = data[0].replace('%22', '')
    
    return OPENAI_REGEX.match(url)


def parse_data(data):
    # ['https://labs.openai.com/s/006MmvzRtjbQQL77hIJkgTd4','text/html','20220623020706','20220623020706','1','1'],
    return {
        'url': data[0].replace('%22', ''),
        'date': datetime.strptime(data[2], "%Y%m%d%H%M%S")
    }


with open('web-archive-data.json', encoding='utf-8') as fh:
    all_data_list = [parse_data(data)
        for data in json.load(fh)
        if is_valid_data(data)]

random.shuffle(all_data_list)

old_data_list = list(filter(lambda data: data['date'] > MIN_OLD_DATE and data['date'] < MAX_OLD_DATE, all_data_list))    
new_data_list = list(filter(lambda data: data['date'] > MIN_NEW_DATE and data['date'] < MAX_NEW_DATE, all_data_list))    

old_data_list = old_data_list[:IMGS_LIMIT_PER_TYPE]
new_data_list = new_data_list[:IMGS_LIMIT_PER_TYPE]
all_data_list = old_data_list + new_data_list

print('OLD posts:', len(old_data_list))
print('NEW posts:', len(new_data_list))

all_data_dict = dict([ (data['url'], data) for data in all_data_list ])


class Dalle2Spider(scrapy.Spider):
    name = 'dalle2'
    start_urls = [ data['url'] for data in all_data_list ]

    def start_requests(self):
        for url in self.start_urls:
            yield Request(
                url,
                cb_kwargs={'data': all_data_dict[url]}
            )

    def parse(self, response, data):        
        title = TITLE_REGEX.search(response.text)        
        title = title[1] if title else 'ERROR'
        data['title'] = title
        
        img_url = IMG_URL_REGEX.search(response.text)
        img_url = img_url[1] if img_url else 'ERROR'
        data['img_url'] = img_url

        yield data
