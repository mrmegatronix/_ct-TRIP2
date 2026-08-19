import urllib.request
import json

query = """
[out:json];
(
  node["highway"="bus_stop"](around:600, -43.478137, 172.617407);
);
out body;
"""
url = "https://overpass-api.de/api/interpreter"
req = urllib.request.Request(url, data=query.encode('utf-8'), headers={'User-Agent': 'Mozilla/5.0'})
try:
    resp = urllib.request.urlopen(req)
    data = json.loads(resp.read().decode('utf-8'))
    for el in data.get('elements', []):
        name = el.get('tags', {}).get('name', 'Unknown')
        print(f"Name: {name}, Lat: {el['lat']}, Lon: {el['lon']}")
except Exception as e:
    print(e)
