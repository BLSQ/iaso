import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../tests/helpers';
import { BasemapList } from './BasemapList';
import { DEFAULT_BASEMAP } from './basemaps';

const checked = (label: string) =>
    screen
        .getByText(label)
        .closest('[role="button"]')
        ?.classList.contains('Mui-selected');

describe('BasemapList', () => {
    it('shows the Protomaps flavors under it, then the raster basemaps', () => {
        renderWithThemeAndIntlProvider(
            <BasemapList basemap={DEFAULT_BASEMAP} onChange={vi.fn()} />,
        );
        expect(checked('Protomaps (Bluesquare)')).toBe(true);
        expect(checked('Light')).toBe(true);
        expect(checked('Dark')).toBe(false);
        expect(checked('Open Street Map')).toBe(false);
    });

    it('picks a flavor or a raster basemap', () => {
        const onChange = vi.fn();
        renderWithThemeAndIntlProvider(
            <BasemapList
                basemap={{ kind: 'raster', key: 'osm' }}
                onChange={onChange}
            />,
        );
        fireEvent.click(screen.getByText('Grayscale'));
        expect(onChange).toHaveBeenLastCalledWith({
            kind: 'protomaps',
            flavor: 'grayscale',
        });
        // the basemap itself: its default flavor
        fireEvent.click(screen.getByText('Protomaps (Bluesquare)'));
        expect(onChange).toHaveBeenLastCalledWith(DEFAULT_BASEMAP);
        fireEvent.click(screen.getByText('ArcGIS Street Map'));
        expect(onChange).toHaveBeenLastCalledWith({
            kind: 'raster',
            key: 'arcgis-street',
        });
    });
});
