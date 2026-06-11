import urllib.request
import urllib.error
import json

try:
    req = urllib.request.Request('http://localhost:8000/api/v1/auth/send-otp', method='POST', headers={'Content-Type': 'application/json'}, data=b'{"username": "test"}')
    with urllib.request.urlopen(req) as response:
        print(response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(f"HTTPError: {e.code}")
    print(e.read().decode('utf-8'))
