import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { getInstancesFilterValues, getValues, useFormState } from './form';

describe('useFormState', () => {
    it('wraps each initial value in a field with no errors', () => {
        const { result } = renderHook(() =>
            useFormState({ name: 'Ada', count: 1 }),
        );

        expect(result.current[0]).toEqual({
            name: { value: 'Ada', errors: [] },
            count: { value: 1, errors: [] },
        });
    });

    it('sets a field value and clears its errors', () => {
        const { result } = renderHook(() => useFormState({ name: 'Ada' }));

        act(() => {
            result.current[2]('name', ['Required']);
        });
        act(() => {
            result.current[1]('name', 'Grace');
        });

        expect(result.current[0].name).toEqual({
            value: 'Grace',
            errors: [],
        });
    });

    it('transforms the value when a transformer is passed', () => {
        const { result } = renderHook(() => useFormState({ count: 1 }));

        act(() => {
            result.current[1]('count', '2', value => Number(value));
        });

        expect(result.current[0].count.value).toBe(2);
    });

    it('sets errors without changing the value', () => {
        const { result } = renderHook(() => useFormState({ name: 'Ada' }));

        act(() => {
            result.current[2]('name', ['Required']);
        });

        expect(result.current[0].name).toEqual({
            value: 'Ada',
            errors: ['Required'],
        });
    });

    it('replaces the whole form when setFormState is called', () => {
        const { result } = renderHook(() =>
            useFormState({ name: 'Ada', count: 1 }),
        );

        act(() => {
            result.current[3]({ city: 'Brussels' });
        });

        expect(result.current[0]).toEqual({
            city: { value: 'Brussels', errors: [] },
        });
    });
});

describe('getValues', () => {
    it('returns the raw field values', () => {
        expect(
            getValues({
                name: { value: 'Ada', errors: ['Required'] },
                count: { value: 1, errors: [] },
            }),
        ).toEqual({ name: 'Ada', count: 1 });
    });
});

describe('getInstancesFilterValues', () => {
    it('returns field values and drops the tab key', () => {
        expect(
            getInstancesFilterValues({
                tab: { value: 'list', errors: [] },
                formIds: { value: '1,2', errors: [] },
            }),
        ).toEqual({ formIds: '1,2' });
    });
});
