import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-ant-path';

/**
 * AntPath component for react-leaflet v5
 * Renders animated "packet flow" lines on the map
 * 
 * @param {Array} positions - Array of [lat, lng] coordinates
 * @param {Object} options - AntPath options (color, pulseColor, delay, weight, dashArray)
 * @param {Object} eventHandlers - Event handlers (click, mouseover, etc.)
 * @param {React.ReactNode} children - Child components (Tooltip, Popup)
 */
const AntPath = ({ positions, options = {}, eventHandlers = {}, children }) => {
    const map = useMap();

    useEffect(() => {
        if (!positions || positions.length < 2) return;

        // Default options for "packet tracer" effect
        const defaultOptions = {
            color: '#10b981',
            pulseColor: '#ffffff',
            weight: 4,
            opacity: 0.8,
            delay: 400,
            dashArray: [10, 20],
            paused: false,
            reverse: false,
            hardwareAccelerated: true,
            ...options
        };

        // Create the ant path
        const antPath = L.polyline.antPath(positions, defaultOptions);
        antPath.addTo(map);

        // Attach event handlers
        if (eventHandlers.click) {
            antPath.on('click', eventHandlers.click);
        }
        if (eventHandlers.mouseover) {
            antPath.on('mouseover', eventHandlers.mouseover);
        }
        if (eventHandlers.mouseout) {
            antPath.on('mouseout', eventHandlers.mouseout);
        }

        // Cleanup on unmount
        return () => {
            map.removeLayer(antPath);
        };
    }, [map, positions, options.color, options.delay, options.weight, options.opacity]);

    return null;
};

export default AntPath;
