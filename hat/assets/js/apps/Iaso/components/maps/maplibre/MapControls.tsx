import React, {
    ButtonHTMLAttributes,
    forwardRef,
    FunctionComponent,
    MouseEvent,
    ReactNode,
    useEffect,
    useState,
} from 'react';
import CenterFocusStrong from '@mui/icons-material/CenterFocusStrong';
import Fullscreen from '@mui/icons-material/Fullscreen';
import FullscreenExit from '@mui/icons-material/FullscreenExit';
import HighlightAlt from '@mui/icons-material/HighlightAlt';
import { alpha, Menu, MenuItem, SxProps, useTheme } from '@mui/material';
import {
    ControlPosition,
    IControl,
    useControl,
    useMap,
} from '@vis.gl/react-maplibre';
import { useSafeIntl } from 'bluesquare-components';
import { createPortal } from 'react-dom';
import MESSAGES from '../messages';
import { Bounds, FIT_BOUNDS_OPTIONS } from './bounds';
import { startBoxZoom } from './boxZoom';

/** For an MUI icon in a `MapControlButton` */
export const MAP_CONTROL_ICON_SX: SxProps = {
    fontSize: 20,
    display: 'block',
    m: 'auto',
};

/** An empty MapLibre control, for React to render into */
class ContainerControl implements IControl {
    readonly container: HTMLDivElement;

    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
    }

    onAdd() {
        return this.container;
    }

    onRemove() {
        this.container.remove();
    }
}

type GroupProps = {
    position?: ControlPosition;
    children: ReactNode;
};

/** A MapLibre control group - buttons stacked in a box, as MapLibre's own - holding `MapControlButton`s */
export const MapControlGroup: FunctionComponent<GroupProps> = ({
    position = 'top-left',
    children,
}) => {
    const control = useControl(() => new ContainerControl(), { position });
    return createPortal(children, control.container);
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    title: string;
    /** a mode it turns on is on */
    active?: boolean;
};

/** A button of a `MapControlGroup`, sized and styled by maplibre-gl.css */
export const MapControlButton = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ title, active, children, ...props }, ref) => {
        const theme = useTheme();
        return (
            <button
                ref={ref}
                type="button"
                title={title}
                aria-label={title}
                aria-pressed={active}
                style={
                    active
                        ? {
                              color: theme.palette.primary.main,
                              backgroundColor: alpha(
                                  theme.palette.primary.main,
                                  0.15,
                              ),
                          }
                        : undefined
                }
                {...props}
            >
                {children}
            </button>
        );
    },
);
MapControlButton.displayName = 'MapControlButton';

/** Zooming in and out, as MapLibre's `NavigationControl`, in the language of the page */
export const ZoomButtons: FunctionComponent = () => {
    const { formatMessage } = useSafeIntl();
    const { current: map } = useMap();
    const [zoom, setZoom] = useState(map?.getZoom() ?? 0);
    useEffect(() => {
        const onZoom = () => map && setZoom(map.getZoom());
        map?.on('zoom', onZoom);
        return () => {
            map?.off('zoom', onZoom);
        };
    }, [map]);
    return (
        <>
            <MapControlButton
                className="maplibregl-ctrl-zoom-in"
                title={formatMessage(MESSAGES.zoomIn)}
                disabled={map ? zoom >= map.getMaxZoom() : false}
                onClick={() => map?.zoomIn()}
            >
                <span className="maplibregl-ctrl-icon" aria-hidden="true" />
            </MapControlButton>
            <MapControlButton
                className="maplibregl-ctrl-zoom-out"
                title={formatMessage(MESSAGES.zoomOut)}
                disabled={map ? zoom <= map.getMinZoom() : false}
                onClick={() => map?.zoomOut()}
            >
                <span className="maplibregl-ctrl-icon" aria-hidden="true" />
            </MapControlButton>
        </>
    );
};

/**
 * Box zoom without holding shift: once on, the next drag draws a box and the map zooms to it, then it turns
 * off. Escape or a second click cancels it.
 */
export const BoxZoomButton: FunctionComponent = () => {
    const { formatMessage } = useSafeIntl();
    const { current: map } = useMap();
    const [active, setActive] = useState(false);
    useEffect(() => {
        if (!active || !map) {
            return undefined;
        }
        return startBoxZoom(map.getMap(), () => setActive(false));
    }, [active, map]);
    return (
        <MapControlButton
            title={formatMessage(MESSAGES.boxZoom)}
            active={active}
            onClick={() => setActive(isActive => !isActive)}
        >
            <HighlightAlt sx={MAP_CONTROL_ICON_SX} />
        </MapControlButton>
    );
};

/** What the map can be fitted to */
export type FitTarget = {
    key: string;
    label: string;
    /** not there yet (loading, nothing located): not offered */
    bounds?: Bounds;
};

type FitProps = {
    /** a single one is fitted to at once, several are picked from a menu */
    targets: FitTarget[];
};

/** Fits the map back to its content - to one of several `targets` when it has some, picked from a menu */
export const FitBoundsButton: FunctionComponent<FitProps> = ({ targets }) => {
    const { formatMessage } = useSafeIntl();
    const { current: map } = useMap();
    const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
    const available = targets.filter(
        (target): target is FitTarget & { bounds: Bounds } =>
            target.bounds !== undefined,
    );
    const hasMenu = available.length > 1;
    const fit = (bounds: Bounds) => map?.fitBounds(bounds, FIT_BOUNDS_OPTIONS);
    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
        if (hasMenu) {
            setMenuAnchor(event.currentTarget);
        } else if (available[0]) {
            fit(available[0].bounds);
        }
    };
    return (
        <>
            <MapControlButton
                title={formatMessage(MESSAGES.fitToBounds)}
                disabled={available.length === 0}
                aria-haspopup={hasMenu ? 'menu' : undefined}
                onClick={handleClick}
            >
                <CenterFocusStrong sx={MAP_CONTROL_ICON_SX} />
            </MapControlButton>
            {hasMenu && (
                <Menu
                    anchorEl={menuAnchor}
                    open={menuAnchor !== null}
                    onClose={() => setMenuAnchor(null)}
                    // in the map: still there in fullscreen
                    container={map?.getContainer()}
                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                >
                    {available.map(target => (
                        <MenuItem
                            key={target.key}
                            dense
                            onClick={() => {
                                fit(target.bounds);
                                setMenuAnchor(null);
                            }}
                        >
                            {target.label}
                        </MenuItem>
                    ))}
                </Menu>
            )}
        </>
    );
};

/** The map in fullscreen and back - not there where the browser can't */
export const FullscreenButton: FunctionComponent = () => {
    const { formatMessage } = useSafeIntl();
    const { current: map } = useMap();
    const container = map?.getContainer();
    const [isFullscreen, setIsFullscreen] = useState(false);
    useEffect(() => {
        const onChange = () =>
            setIsFullscreen(
                container !== undefined &&
                    document.fullscreenElement === container,
            );
        document.addEventListener('fullscreenchange', onChange);
        return () => document.removeEventListener('fullscreenchange', onChange);
    }, [container]);
    if (!container || !document.fullscreenEnabled) {
        return null;
    }
    const title = formatMessage(
        isFullscreen ? MESSAGES.exitFullscreen : MESSAGES.fullscreen,
    );
    return (
        <MapControlButton
            title={title}
            onClick={() =>
                // refused (permissions, no user gesture): nothing to do but stay as is
                (isFullscreen
                    ? document.exitFullscreen()
                    : container.requestFullscreen()
                ).catch(() => undefined)
            }
        >
            {isFullscreen ? (
                <FullscreenExit sx={MAP_CONTROL_ICON_SX} />
            ) : (
                <Fullscreen sx={MAP_CONTROL_ICON_SX} />
            )}
        </MapControlButton>
    );
};
