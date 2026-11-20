import L from 'leaflet';
import location from '../../../images/location.svg';
import square from '../../../images/square.svg';

declare module 'leaflet' {
    // Leaflet publishes this as a namespace; interface merging has to follow it.
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Control {
        interface ZoomOptions {
            zoomInfoTitle?: string;
            zoomBoxTitle?: string;
            fitToBoundsTitle?: string;
            searchTitle?: string;
            fitToBounds?: () => void;
        }
    }
}

/*
 * In react use the <ZoomControl> component from mapUtils instead !
 *  from L.Control.ZoomBar
 * A control bar that extends standard zoom control.
 *
 * Adds:
 * - Zoom info, current zoom level (from `0` to `18`).
 * - Box zoom (leaflet enables this feature by pressing `shift`).
 * - Fit to relevant bounds, requires `fitToBounds` option (function),
 *     without it, it's not going to be included in the bar.
 */

type ZoomBarOptions = L.Control.ZoomOptions & {
    zoomInfoTitle: string;
    zoomBoxTitle: string;
    fitToBoundsTitle: string;
    searchTitle: string;
    fitToBounds?: () => void;
};

type BoxZoomMouseEvent = {
    clientX: number;
    clientY: number;
    which: number;
    shiftKey: boolean;
};

/** Leaflet map fields this control uses that are not on the public Map type. */
interface ZoomBarMap extends L.Map {
    _container: HTMLElement;
    boxZoom: L.Handler & {
        addHooks(): void;
        removeHooks(): void;
        _onMouseDown(event: BoxZoomMouseEvent): void;
    };
}

type ZoomButtonHandler = (this: ZoomBar, event: L.LeafletMouseEvent) => void;

interface ZoomBar extends L.Control.Zoom {
    options: ZoomBarOptions;
    _map: ZoomBarMap;
    _zoomBoxActive: boolean;
    /** Leaflet writes the numeric zoom level straight into innerHTML. */
    _zoomInfoButton: { innerHTML: string | number };
    _zoomInButton: HTMLElement;
    _zoomOutButton: HTMLElement;
    _zoomBoxButton: HTMLElement;
    _fitToBoundsButton?: HTMLElement;
    _createButton(
        html: string | number | undefined,
        title: string | undefined,
        className: string,
        container: HTMLElement,
        fn: ZoomButtonHandler | (() => void),
        context: ZoomBar,
    ): HTMLElement;
    _zoomIn(event?: L.LeafletMouseEvent): void;
    _zoomOut(event?: L.LeafletMouseEvent): void;
    _updateDisabled(): void;
    _zoomBox(): void;
    _zoomBoxHTML(): string;
    _zoomBoxStateOn(): void;
    _zoomBoxStateOff(): void;
    _zoomBoxHandleMouseDown(event: L.LeafletMouseEvent): void;
}

interface ZoomBarPrototype {
    options: ZoomBarOptions;
    initialize(options?: ZoomBarOptions): void;
    onAdd(map: ZoomBarMap): HTMLElement;
    onRemove(): void;
    _updateInfoValue(): void;
    _zoomBox(): void;
    _zoomBoxHTML(): string;
    _zoomBoxStateOn(): void;
    _zoomBoxStateOff(): void;
    _zoomBoxHandleMouseDown(event: L.LeafletMouseEvent): void;
}

const zoomBarExtension: ZoomBarPrototype & ThisType<ZoomBar> = {
    options: {
        zoomInfoTitle: 'Current zoom level',
        zoomBoxTitle:
            'Click here then draw a square on the map, to zoom in to an area',
        fitToBoundsTitle: 'Fit to bounds',
        searchTitle: 'Search village',
    },

    initialize(options) {
        L.setOptions(this, options);
        this._zoomBoxActive = false;
    },

    onAdd(map) {
        const className = 'leaflet-control-zoom';
        const container = L.DomUtil.create(
            'div',
            `${className} leaflet-bar hide-on-print`,
        );
        const { options } = this;
        this._map = map;

        // _createButton signature: function (html, title, className, container, fn)

        // this._zoomInfoButton = this._createButton(this._map.getZoom(), options.zoomInfoTitle,
        //   className + '-info leaflet-disabled', container, function () {}, this)

        this._zoomInButton = this._createButton(
            options.zoomInText,
            options.zoomInTitle,
            `${className}-in`,
            container,
            this._zoomIn,
            this,
        );

        this._zoomOutButton = this._createButton(
            options.zoomOutText,
            options.zoomOutTitle,
            `${className}-out`,
            container,
            this._zoomOut,
            this,
        );

        // Bundler-resolved URLs (not djangoStaticUrl — see Iaso/utils/djangoStaticUrl.ts).
        this._zoomBoxButton = this._createButton(
            `<img src="${square}"/>`,
            options.zoomBoxTitle,
            `${className}-box`,
            container,
            this._zoomBox,
            this,
        );

        if (options.fitToBounds) {
            this._fitToBoundsButton = this._createButton(
                `<img src="${location}"/>`,
                options.fitToBoundsTitle,
                `${className}-fit`,
                container,
                options.fitToBounds,
                this,
            );
        }
        this._updateDisabled();
        map.on('zoomend zoomlevelschange', this._updateDisabled, this);
        // .on('zoomend zoomlevelschange', this._updateInfoValue, this)

        return container;
    },

    onRemove() {
        if (this._map) {
            this._map.off(
                'zoomend zoomlevelschange',
                this._updateDisabled,
                this,
            );
            // .off('zoomend zoomlevelschange', this._updateInfoValue, this)
        }
    },

    /** ***************************************************************************
     * Zoom info
     *************************************************************************** */

    _updateInfoValue() {
        this._zoomInfoButton.innerHTML = this._map.getZoom();
    },

    /** ***************************************************************************
     * Box zoom
     * https://github.com/gregallensworth/L.Control.BoxZoom
     *************************************************************************** */
    _zoomBox() {
        if (this._zoomBoxActive) {
            this._zoomBoxStateOff();
        } else {
            this._zoomBoxStateOn();
        }
    },
    _zoomBoxHTML() {
        return '';
    },
    _zoomBoxStateOn() {
        this._zoomBoxActive = true;
        this._map.dragging.disable();
        this._map.boxZoom.addHooks();

        this._map.on('mousedown', this._zoomBoxHandleMouseDown, this);
        this._map.on('boxzoomend', this._zoomBoxStateOff, this);

        L.DomUtil.addClass(this._zoomBoxButton, 'active');
        L.DomUtil.addClass(
            this._map._container,
            'leaflet-control-boxzoom-active',
        );
    },
    _zoomBoxStateOff() {
        this._zoomBoxActive = false;
        if (this._map) {
            this._map.off('mousedown', this._zoomBoxHandleMouseDown, this);
            this._map.dragging.enable();
            this._map.boxZoom.removeHooks();
            L.DomUtil.removeClass(this._zoomBoxButton, 'active');
            L.DomUtil.removeClass(
                this._map._container,
                'leaflet-control-boxzoom-active',
            );
        }
    },
    _zoomBoxHandleMouseDown(event) {
        L.DomEvent.stopPropagation(event);

        // https://github.com/Leaflet/Leaflet/blob/master/src/map/handler/Map.BoxZoom.js
        this._map.boxZoom._onMouseDown({
            clientX: event.originalEvent.clientX,
            clientY: event.originalEvent.clientY,
            which: 1,
            shiftKey: true,
        });
    },
};

// Leaflet's extend() builds a new constructor; the public Zoom class stays the same.
L.Control.Zoom = L.Control.Zoom.extend(
    zoomBarExtension,
) as typeof L.Control.Zoom;
