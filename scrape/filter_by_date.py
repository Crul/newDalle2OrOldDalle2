from datetime import datetime
import json

MAX_OLD_DATE = datetime(2022, 6, 15)
MIN_NEW_DATE = datetime(2022, 7, 27)
MAX_IMGS_PER_TYPE = 250

def main():
    with open('scrapy-output.json', encoding='utf-8') as fh:
        all_data = json.load(fh)
    
    old_data = filter(all_data, lambda date: date < MAX_OLD_DATE)
    new_data = filter(all_data, lambda date: date > MIN_NEW_DATE)
    limit = min(MAX_IMGS_PER_TYPE, len(old_data), len(new_data))
    
    data = {
        'old': old_data[:limit],
        'new': new_data[:limit]
    }
   
    with open('../data.js', 'w', encoding='utf8') as json_file:
        json_txt = json.dumps(data)
        json_file.write('var data = ' + json_txt)
    

def filter(all_data, comp_fn):
    return [
        data for data in all_data
        if comp_fn(datetime.strptime(data['date'], '%Y-%m-%d %H:%M:%S'))
    ]


if __name__ == "__main__":
    main()
