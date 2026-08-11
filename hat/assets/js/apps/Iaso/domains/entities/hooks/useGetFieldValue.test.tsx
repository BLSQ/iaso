import React from 'react';
import { render, renderHook } from '@testing-library/react';
import { textPlaceholder } from 'bluesquare-components';
import moment from 'moment';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FormDescriptor } from '../../forms/types/forms';
import { useGetFieldValue } from './useGetFieldValue';

const {
    mockFormatMessage,
    mockGetDescriptorValue,
    mockFindDescriptorInChildren,
    mockFormatLabel,
} = vi.hoisted(() => ({
    mockFormatMessage: vi.fn(
        (msg, values) => `${msg.id || msg}:${values?.type ?? ''}`,
    ),
    mockGetDescriptorValue: vi.fn(),
    mockFindDescriptorInChildren: vi.fn(),
    mockFormatLabel: vi.fn(child => child.label || child.name),
}));

vi.mock('bluesquare-components', async importOriginal => {
    const actual = await importOriginal<typeof import('bluesquare-components')>();
    return {
        ...actual,
        useSafeIntl: () => ({
            formatMessage: mockFormatMessage,
        }),
    };
});

vi.mock('Iaso/utils', () => ({
    findDescriptorInChildren: mockFindDescriptorInChildren,
    getDescriptorValue: mockGetDescriptorValue,
}));

vi.mock('../../instances/utils', () => ({
    formatLabel: mockFormatLabel,
}));

vi.mock('../../../components/maps/MarkerMapComponent', () => ({
    MarkerMap: ({ latitude, longitude }: { latitude?: number; longitude?: number }) => (
        <div
            data-testid="marker-map"
            data-latitude={latitude}
            data-longitude={longitude}
        />
    ),
}));

describe('useGetFieldValue', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        moment.locale('en');
        mockGetDescriptorValue.mockReturnValue('Male');
    });

    const getValue = (formDescriptors?: FormDescriptor[]) => {
        const { result } = renderHook(() => useGetFieldValue(formDescriptors));
        return result.current;
    };

    describe('scalar text-like types', () => {
        it.each([
            ['text', 'hello'],
            ['calculate', '42'],
            ['integer', 7],
            ['decimal', 3.14],
            ['barcode', 'ABC-123'],
            ['note', 'a note'],
        ] as const)('returns raw value for %s', (type, value) => {
            const getFieldValue = getValue();
            expect(
                getFieldValue('field', { field: value } as any, type),
            ).toBe(value);
        });

        it('returns placeholder when value is missing', () => {
            const getFieldValue = getValue();
            expect(getFieldValue('field', {} as any, 'text')).toBe(
                textPlaceholder,
            );
        });
    });

    describe('date / datetime', () => {
        it('formats date with locale L', () => {
            const getFieldValue = getValue();
            expect(
                getFieldValue('dob', { dob: '2020-01-15' } as any, 'date'),
            ).toBe(moment('2020-01-15').format('L'));
        });

        it.each(['start', 'end', 'dateTime'] as const)(
            'formats %s with locale LTS',
            type => {
                const getFieldValue = getValue();
                const raw = '2020-01-15T10:30:00';
                expect(
                    getFieldValue('ts', { ts: raw } as any, type),
                ).toBe(moment(raw).format('LTS'));
            },
        );

        it('returns placeholder for empty date', () => {
            const getFieldValue = getValue();
            expect(getFieldValue('dob', {} as any, 'date')).toBe(
                textPlaceholder,
            );
        });
    });

    describe('time', () => {
        it('formats ODK time with offset using LT', () => {
            const getFieldValue = getValue();
            const raw = '10:30:00.000+02:00';
            expect(
                getFieldValue('appointment', { appointment: raw } as any, 'time'),
            ).toBe(moment.parseZone(raw, ['HH:mm:ss.SSSZ']).format('LT'));
        });

        it('formats plain HH:mm:ss time', () => {
            const getFieldValue = getValue();
            const raw = '14:05:00';
            expect(
                getFieldValue('appointment', { appointment: raw } as any, 'time'),
            ).toBe(moment.parseZone(raw, ['HH:mm:ss']).format('LT'));
        });

        it('formats HH:mm time', () => {
            const getFieldValue = getValue();
            const raw = '09:15';
            expect(
                getFieldValue('appointment', { appointment: raw } as any, 'time'),
            ).toBe(moment.parseZone(raw, ['HH:mm']).format('LT'));
        });

        it('returns placeholder for empty time', () => {
            const getFieldValue = getValue();
            expect(
                getFieldValue('appointment', {} as any, 'time'),
            ).toBe(textPlaceholder);
        });

        it('returns placeholder for invalid time', () => {
            const getFieldValue = getValue();
            expect(
                getFieldValue(
                    'appointment',
                    { appointment: 'not-a-time' } as any,
                    'time',
                ),
            ).toBe(textPlaceholder);
        });
    });

    describe('select one', () => {
        it.each(['select one', 'select_one'] as const)(
            'delegates to getDescriptorValue for %s',
            type => {
                const descriptors = [{ children: [] }] as unknown as FormDescriptor[];
                const getFieldValue = getValue(descriptors);
                const fileContent = { gender: 'M' } as any;

                expect(getFieldValue('gender', fileContent, type)).toBe('Male');
                expect(mockGetDescriptorValue).toHaveBeenCalledWith(
                    'gender',
                    fileContent,
                    descriptors,
                );
            },
        );
    });

    describe('select multiple', () => {
        const formDescriptors = [
            { children: [] },
        ] as unknown as FormDescriptor[];

        beforeEach(() => {
            mockFindDescriptorInChildren.mockReturnValue({
                children: [
                    { name: 'fever', label: 'Fever' },
                    { name: 'cough', label: 'Cough' },
                    { name: 'rash', label: 'Rash' },
                ],
            });
        });

        it.each([
            'select_multiple',
            'select multiple',
            'select_all_that_apply',
            'select all that apply',
        ] as const)('joins matching labels for %s', type => {
            const getFieldValue = getValue(formDescriptors);
            expect(
                getFieldValue(
                    'symptoms',
                    { symptoms: 'fever cough' } as any,
                    type,
                ),
            ).toBe('Fever - Cough');
        });

        it('returns placeholder when no matching choices', () => {
            mockFindDescriptorInChildren.mockReturnValue({
                children: [{ name: 'fever', label: 'Fever' }],
            });
            const getFieldValue = getValue(formDescriptors);
            expect(
                getFieldValue(
                    'symptoms',
                    { symptoms: 'unknown' } as any,
                    'select_multiple',
                ),
            ).toBe(textPlaceholder);
        });
    });

    describe('geopoint', () => {
        it('renders MarkerMap with parsed coordinates', () => {
            const getFieldValue = getValue();
            const node = getFieldValue(
                'location',
                { location: '1.23 4.56 0 0' } as any,
                'geopoint',
            );
            const { getByTestId } = render(<>{node}</>);
            const map = getByTestId('marker-map');
            expect(map).toHaveAttribute('data-latitude', '1.23');
            expect(map).toHaveAttribute('data-longitude', '4.56');
        });

        it('returns placeholder when geopoint is empty', () => {
            const getFieldValue = getValue();
            expect(getFieldValue('location', {} as any, 'geopoint')).toBe(
                textPlaceholder,
            );
        });
    });

    describe('unsupported type', () => {
        it('returns translated unsupported message', () => {
            const getFieldValue = getValue();
            expect(
                getFieldValue('secret', { secret: 'x' } as any, 'hidden'),
            ).toBe('iaso.entities.typeNotSupported:hidden');
            expect(mockFormatMessage).toHaveBeenCalled();
        });
    });
});
