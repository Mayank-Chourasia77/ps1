import requests
import time

print("Testing backend /nodes endpoint...")
for i in range(5):
    try:
        r = requests.get('http://127.0.0.1:8000/nodes')
        if r.status_code == 200:
            print("Success!")
            print(r.json()['nodes'][:5])
            exit(0)
    except Exception as e:
        print(f"Attempt {i+1} failed: {e}")
        time.sleep(2)

print("Failed after 5 attempts.")
exit(1)
