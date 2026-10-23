import React, { FC, useCallback } from 'react';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import { useSafeIntl } from 'bluesquare-components';
import { IControl, LngLatBounds } from 'maplibre-gl';
import { createPortal } from 'react-dom';
import { useControl, useMap } from 'react-map-gl/maplibre';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../messages';

export const FIT_BOUNDS_PADDING = 20;

const styles = {
    icon: {
        display: 'block',
        margin: 'auto',
        fontSize: 20,
    },
} satisfies SxStyles;

// The button is rendered by React into this container, styled like the MapLibre controls.
class PortalControl implements IControl {
    readonly container = document.createElement('div');

    constructor() {
        this.container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
    }

    onAdd(): HTMLElement {
        return this.container;
    }

    onRemove(): void {
        this.container.remove();
    }
}

type Props = {
    bounds: LngLatBounds;
};

export const FitBoundsControl: FC<Props> = ({ bounds }) => {
    const { formatMessage } = useSafeIntl();
    const { current: map } = useMap();
    const control = useControl(() => new PortalControl(), {
        position: 'top-left',
    });
    const handleFit = useCallback(
        () =>
            map?.fitBounds(bounds, {
                padding: FIT_BOUNDS_PADDING,
                duration: 0,
            }),
        [map, bounds],
    );
    const title = formatMessage(MESSAGES.fitToBounds);
    return createPortal(
        <button
            type="button"
            title={title}
            aria-label={title}
            onClick={handleFit}
        >
            <CenterFocusStrongIcon sx={styles.icon} />
        </button>,
        control.container,
    );
};
