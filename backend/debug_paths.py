import os
print(f"Current Working Directory: {os.getcwd()}")
print(f"File Directory: {os.path.dirname(os.path.abspath(__file__))}")
expected_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "traffic_data_simulated.csv")
print(f"Expected CSV Path: {expected_path}")
print(f"Exists? {os.path.exists(expected_path)}")
print(f"Directory listing of ..:")
try:
    print(os.listdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")))
except Exception as e:
    print(e)
