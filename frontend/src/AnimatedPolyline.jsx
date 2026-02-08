import { useEffect, useRef } from 'react';
import { Polyline, Tooltip } from 'react-leaflet';

/**
 * AnimatedPolyline - A Polyline that applies CSS animation classes directly to the SVG path
 * This is needed because react-leaflet's className prop doesn't apply to the path element
 */
const AnimatedPolyline = ({
    positions,
    pathOptions,
    flowClass,
    eventHandlers,
    tooltipContent
}) => {
    const polylineRef = useRef(null);

    useEffect(() => {
        if (polylineRef.current && flowClass) {
            // Get the actual Leaflet path element
            const pathElement = polylineRef.current.getElement();
            if (pathElement) {
                // Remove old animation classes
                pathElement.classList.remove(
                    'traffic-flow-anim',
                    'flow-fast',
                    'flow-medium',
                    'flow-slow',
                    'flow-optimized'
                );
                // Add new classes
                flowClass.split(' ').forEach(cls => {
                    if (cls) pathElement.classList.add(cls);
                });
            }
        }
    }, [flowClass]);

    return (
        <Polyline
            ref={polylineRef}
            positions={positions}
            pathOptions={pathOptions}
            eventHandlers={eventHandlers}
        >
            {tooltipContent && (
                <Tooltip sticky>
                    {tooltipContent}
                </Tooltip>
            )}
        </Polyline>
    );
};

export default AnimatedPolyline;
