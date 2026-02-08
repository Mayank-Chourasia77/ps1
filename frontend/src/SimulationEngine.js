// SimulationEngine.js - Traffic Packet Tracer Formula Engine

/**
 * Calculate live metrics based on route data and optimization state
 * @param {Object} routeData - Current route metrics (flow, congestion, speed)
 * @param {boolean} isOptimized - Whether optimized mode is active
 * @returns {Object} - Calculated metrics for display
 */
export const calculateLiveMetrics = (routeData, isOptimized) => {
    // Default values if no route data
    const baseFlow = routeData?.flow || 1800;
    const congestionIndex = routeData?.congestion || 0.1;
    const speed = routeData?.speed || 35;

    // Total Travel Cost: (Traffic_Volume * 150) * (isOptimized ? 0.6 : Congestion_Index^2)
    const costMultiplier = isOptimized ? 0.6 : Math.pow(Math.max(congestionIndex, 0.3), 2);
    const totalTravelCost = (baseFlow * 150) * costMultiplier + (Math.random() * 500);

    // System Latency: Base_Time + (Congestion_Index * 45 minutes)
    const baseTime = 15; // 15 min base
    const latencyMinutes = baseTime + (congestionIndex * 45 * (isOptimized ? 0.4 : 1));
    const latencyStatus = latencyMinutes > 30 ? 'Critical' : (latencyMinutes > 20 ? 'Moderate' : 'Normal');

    // Vehicle Throughput: Traffic_Volume * (isOptimized ? 1.2 : 0.5)
    // Higher congestion = lower throughput
    const throughputMultiplier = isOptimized ? 1.2 : (1 - congestionIndex * 0.6);
    const vehicleThroughput = Math.round(baseFlow * throughputMultiplier * 40 + (Math.random() * 100));

    return {
        totalTravelCost: Math.round(totalTravelCost),
        latencyMinutes: Math.round(latencyMinutes),
        latencyStatus,
        vehicleThroughput,
        congestionPercentage: Math.round(congestionIndex * 100),
        speed: Math.round(speed)
    };
};

/**
 * Get visual state for packet animation
 * @param {number} congestion - Congestion index (0-1)
 * @param {boolean} isOptimized - Optimization state
 * @returns {Object} - Visual properties for animation
 */
export const getPacketVisualState = (congestion, isOptimized) => {
    if (isOptimized) {
        return {
            color: '#22c55e', // Green
            animationSpeed: 0.5, // Fast
            opacity: 1.0,
            state: 'FREE_FLOW'
        };
    }

    if (congestion > 0.5) {
        return {
            color: '#ef4444', // Red
            animationSpeed: 3.0, // Slow
            opacity: 0.6,
            state: 'CONGESTION'
        };
    }

    if (congestion > 0.25) {
        return {
            color: '#f59e0b', // Orange/Amber
            animationSpeed: 1.5,
            opacity: 0.8,
            state: 'MODERATE'
        };
    }

    return {
        color: '#22c55e', // Green
        animationSpeed: 0.8,
        opacity: 0.9,
        state: 'FREE_FLOW'
    };
};

/**
 * Simulation timeline configuration
 */
export const SIMULATION_TIMELINE = {
    PHASE_1: { duration: 10000, name: 'Normal Flow', congestion: 0.15, speed: 35 },
    PHASE_2: { duration: 10000, name: 'Rush Hour', congestion: 0.85, speed: 12 },
    PHASE_3: { duration: 10000, name: 'AI Optimization', congestion: 0.2, speed: 42, optimized: true }
};

export default {
    calculateLiveMetrics,
    getPacketVisualState,
    SIMULATION_TIMELINE
};
