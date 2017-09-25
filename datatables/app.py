# TODO: use celery to split worker tasks for API calls, other refacotring for speed
# TODO: refactor, workers time out for large requests, also add progress or paginated loads
from flask import Flask, render_template
from flask import json
from flask import request
import pandas as pd
from datetime import datetime, timedelta

header_codes = {
    '% Change From 52week High': 'k5',
    '% Change From 52week Low': 'j6',
    '1yr Target Price': 't8',
    '200day Moving Average': 'm4',
    '50day Moving Average': 'm3',
    '52week High': 'k',
    '52week Low': 'j',
    '52week Range': 'w',
    'Ask': 'a',
    'Ask Size': 'a5',
    'Average Daily Volume': 'a2',
    'Bid': 'b',
    'Bid Size': 'b6',
    'Book Value': 'b4',
    'Change': 'c1',
    'Change From 200day Moving Average': 'm5',
    'Change From 50day Moving Average': 'm7',
    'Change From 52week High': 'k4',
    'Change From 52week Low': 'j5',
    'Change in Percent': 'p2',
    'Days High': 'h',
    'Days Low': 'g',
    'Days Range': 'm',
    'Dividend Pay Date': 'r1',
    'Dividend Yield': 'y',
    'Dividend/Share': 'd',
    'EBITDA': 'j4',
    'Earnings/Share': 'e',
    'ExDividend Date': 'q',
    'Float Shares': 'f6',
    'Last trade Date': 'd1',
    'Last trade Price': 'l1',
    'Last trade Size': 'k3',
    'Last trade Time': 't1',
    'Market Capitalisation': 'j1',
    'Name': 'n',
    'Open': 'o',
    'P/E Ratio': 'r',
    'PEG Ratio': 'r5',
    'Percent Change From 200day Moving Average': 'm6',
    'Percent Change From 50day Moving Average': 'm8',
    'Previous Close': 'p',
    'Stock Exchange': 'x',
    'Volume': 'v'
 }


def get_historic(sym):
    t1 = datetime.today().strftime('%b+%d%%2C+%Y')
    t0 = (datetime.today() - timedelta(days=15)).strftime('%b+%d%%2C+%Y')
    url_hist = 'http://www.google.com/finance/historical?q={0}&startdate={1}&enddate={2}&output=csv'
    url_hist = url_hist.format(str(sym).strip(), t0, t1)
    print url_hist
    try:
        price_hist = pd.read_csv(url_hist)
        return price_hist['Close'].tolist()
    except:
        return None


def create_app():
    # instance relative looks for an instance folder
    app = Flask(__name__, instance_relative_config=True)

    # first load config.settings.py
    app.config.from_object('config.settings')
    # override config for prod from instance.config.py, silent allows it to be empty and not crash
    app.config.from_pyfile('settings.py', silent=True)

    @app.route('/test'):
        def tester():
            reeturn app.config.HELLO

    @app.route('/')
    def index():
        return render_template('index.html')


    @app.route('/_data-json')
    def data_json():
        with app.open_resource('static/data/sample_data.json') as f:
            data = json.load(f)
        return json.jsonify(data)


    @app.route('/stock-lookup')
    def stock_lookup():
        return render_template('stocks_lookup.html')


    @app.route('/_stocks_datapull', methods=['GET', 'POST'])
    def stocks_datapull():
        if request.method == 'POST':
            df = pd.read_json(request.data)
            df = df[df[0] != '']
            df.dropna(inplace=True)
            df['sym'] = df.iloc[:, 0].str.strip()
            cols = ['Name', 'Stock Exchange', 'Market Capitalisation', 'Open', 'Days High', 'Days Low', 'Days Range',
                    'Volume', 'Average Daily Volume']
            url = 'http://download.finance.yahoo.com/d/quotes.csv?s='
            url += '+'.join(x for x in df['sym'].values)
            url += '&f=' + ''.join(header_codes[x] for x in cols)
            print 'yahoo api: ', url
            stocks = pd.read_csv(url, header=None)
            stocks.columns = cols
            stocks['Symbol'] = df.iloc[:, 0]
            cols.insert(0, 'Symbol')
            stocks = stocks[cols]
            stocks['Historic'] = stocks['Symbol'].map(lambda x: get_historic(x))
            print stocks.head()
            return stocks.to_json(orient='records')

    return app