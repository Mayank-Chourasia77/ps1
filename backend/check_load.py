import sys
import os
# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

print("Importing main...")
try:
    import main
    print(f"df shape: {main.df.shape}")
    print(f"df head: {main.df.head()}")
    
    # Test get_nodes logic
    print("Testing get_nodes logic...")
    if main.df.empty:
        print("df is empty")
    else:
        if 'timestamp' in main.df.columns:
            latest = main.df['timestamp'].max()
            print(f"Latest timestamp: {latest}")
            curr = main.df[main.df['timestamp'] == latest]
            print(f"Rows at latest: {len(curr)}")
            nodes = list(set(curr['u'].unique()) | set(curr['v'].unique()))
            print(f"Found {len(nodes)} nodes: {nodes[:5]}")
except Exception as e:
    print(f"Error importing main: {e}")
