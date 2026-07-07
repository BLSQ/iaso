import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useGetFormsDropdownOptions } from './useGetFormsDropdownOptions';

const { mockUseSnackQuery, mockGetRequest, mockMakeUrlWithParams } = vi.hoisted(
    () => ({
        mockUseSnackQuery: vi.fn(),
        mockGetRequest: vi.fn(),
        mockMakeUrlWithParams: vi.fn(),
    }),
);

vi.mock('../../../libs/apiHooks', () => ({
    useSnackQuery: mockUseSnackQuery,
}));

vi.mock('../../../libs/Api', () => ({
    getRequest: mockGetRequest,
}));

vi.mock('../../../libs/utils', () => ({
    makeUrlWithParams: mockMakeUrlWithParams,
}));

// Run the query's `select` transform against a canned API response and expose
// the result as `data`, so we can assert what the hook returns to components.
const mockApiResponse = (apiData: any) => {
    mockUseSnackQuery.mockImplementation(({ options }: any) => ({
        data: options?.select ? options.select(apiData) : apiData,
        isLoading: false,
    }));
};

// The `fields` query param the hook built for the request.
const requestedFields = (): string => {
    const [, queryParams] = mockMakeUrlWithParams.mock.calls.at(-1) ?? [];
    return queryParams?.fields;
};

describe('useGetFormsDropdownOptions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockMakeUrlWithParams.mockReturnValue('/api/forms/dropdown/');
        mockApiResponse({ forms: [] });
    });

    it('hits the lightweight dropdown endpoint', () => {
        renderHook(() => useGetFormsDropdownOptions());

        expect(mockMakeUrlWithParams).toHaveBeenCalledWith(
            '/api/forms/dropdown/',
            expect.any(Object),
        );
    });

    it('requests only id and name by default', () => {
        renderHook(() => useGetFormsDropdownOptions());

        expect(requestedFields()).toBe('id,name');
    });

    it('appends extraFields to the requested fields', () => {
        renderHook(() =>
            useGetFormsDropdownOptions({
                extraFields: ['period_type', 'label_keys'],
            }),
        );

        expect(requestedFields()).toBe('id,name,period_type,label_keys');
    });

    it('maps forms to value/label options', () => {
        mockApiResponse({
            forms: [
                { id: 1, name: 'Alpha' },
                { id: 2, name: 'Beta' },
            ],
        });

        const { result } = renderHook(() => useGetFormsDropdownOptions());

        expect(result.current.data).toEqual([
            { value: 1, label: 'Alpha', original: { id: 1, name: 'Alpha' } },
            { value: 2, label: 'Beta', original: { id: 2, name: 'Beta' } },
        ]);
    });

    it('keeps the requested extra fields available in each option `original`', () => {
        mockApiResponse({
            forms: [
                {
                    id: 1,
                    name: 'Alpha',
                    period_type: 'MONTH',
                    label_keys: ['name'],
                },
            ],
        });

        const { result } = renderHook(() =>
            useGetFormsDropdownOptions({
                extraFields: ['period_type', 'label_keys'],
            }),
        );

        const [option] = result.current.data ?? [];
        expect(option.value).toBe(1);
        expect(option.label).toBe('Alpha');
        // The extra fields the caller asked for must survive into `original`
        expect(option.original.period_type).toBe('MONTH');
        expect(option.original.label_keys).toEqual(['name']);
    });

    it('returns an empty array when the response has no forms', () => {
        mockApiResponse({});

        const { result } = renderHook(() => useGetFormsDropdownOptions());

        expect(result.current.data).toEqual([]);
    });

    it('forwards params (e.g. filters) to the query', () => {
        renderHook(() =>
            useGetFormsDropdownOptions({
                params: { orgUnitTypeIds: 123 },
            }),
        );

        const [, queryParams] = mockMakeUrlWithParams.mock.calls.at(-1) ?? [];
        expect(queryParams.orgUnitTypeIds).toBe(123);
    });
});
