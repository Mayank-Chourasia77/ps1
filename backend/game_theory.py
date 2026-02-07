
# 1. BPR Function (Bureau of Public Roads)
# Calculates how long it takes to travel a road based on congestion.
# Formula: Time = FreeFlowTime * (1 + 0.15 * (Congestion/Capacity)^4)
def calculate_travel_time(congestion_score, free_flow_time=10):
    # We treat 'congestion_score' (0-100) as the Volume/Capacity ratio scaled up
    # 20 is "free flow", 100 is "jammed"
    return free_flow_time * (1 + 0.15 * ((congestion_score / 20) ** 4))

# 2. The Core Metric: Price of Anarchy (PoA)
def calculate_metrics(traffic_data):
    """
    traffic_data: List of dicts [{'from': 'A', 'to': 'B', 'congestion': 80}, ...]
    """
    if not traffic_data:
        return {
            "price_of_anarchy": 0,
            "nash_cost": 0,
            "optimal_cost": 0,
            "status": "No Data"
        }

    current_congestion = [row['congestion'] for row in traffic_data]
    
    # NASH EQUILIBRIUM (Current Reality)
    # This is the total time everyone is currently wasting because they drive selfishly.
    nash_travel_times = [calculate_travel_time(c) for c in current_congestion]
    nash_total_cost = sum(nash_travel_times)
    
    # SYSTEM OPTIMAL (The AI Solution)
    # We simulate: What if we rerouted traffic so no road exceeds 70% congestion?
    optimal_congestion = []
    for c in current_congestion:
        if c > 70:
            # Reroute traffic: Reduce jam to 70%, assume rerouted cars take 20% longer path
            # We are just appending the congestion level here, so we need to be careful.
            # The logic in the prompt was: "optimal_congestion.append(70)"
            # But the comment says "assume rerouted cars take 20% longer path". 
            # If we just change congestion to 70, calculate_travel_time(70) will be calculated.
            # The prompt code snippet processed it as just appending 70.
            # I will follow the code snippet logic which is `optimal_congestion.append(70)`.
            optimal_congestion.append(70) 
        else:
            optimal_congestion.append(c)
            
    optimal_travel_times = [calculate_travel_time(c) for c in optimal_congestion]
    
    # Correction for the rerouting penalty mentioned in the comment?
    # The original snippet didn't explicitly add 20% penalty in the code logic, 
    # it just said "assume rerouted cars take 20% longer path" in a comment but executed `optimal_congestion.append(70)`.
    # However, to be more robust or true to the comment, maybe we should add penalty? 
    # But I should stick to the provided code logic unless it's clearly broken. 
    # The snippet calculated `optimal_travel_times` based on `optimal_congestion`.
    # I will stick to the provided snippet for now.
    
    optimal_total_cost = sum(optimal_travel_times)
    
    # PRICE OF ANARCHY
    # If PoA = 1.5, it means selfish driving makes traffic 50% worse than it needs to be.
    if optimal_total_cost == 0: optimal_total_cost = 1 # Avoid div by zero
    poa = nash_total_cost / optimal_total_cost
    
    return {
        "price_of_anarchy": round(poa, 2),
        "nash_cost": round(nash_total_cost, 0),
        "optimal_cost": round(optimal_total_cost, 0),
        "status": "Inefficient" if poa > 1.1 else "Optimal"
    }
