import { Polyline, Tooltip } from 'react-leaflet';

/**
 * AnimatedPolyline - Uses Leaflet's native className in pathOptions
 * This is the correct way to apply CSS classes to SVG paths in Leaflet
 */
const AnimatedPolyline = ({
    positions,
    pathOptions,
    flowClass,
    eventHandlers,
    tooltipContent
}) => {
    // Merge flowClass into pathOptions.className
    const mergedOptions = {
        ...pathOptions,
        className: flowClass || ''
    };

    return (
        <Polyline
            positions={positions}
            pathOptions={mergedOptions}
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
