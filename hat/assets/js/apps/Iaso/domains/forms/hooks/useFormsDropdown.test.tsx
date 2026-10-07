import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useFormsDropdown } from './useFormsDropdown';

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

const mockApiResponse = (apiData: any) => {
    mockUseSnackQuery.mockImplementation(() => ({
        data: apiData,
        isLoading: false,
    }));
};

// The query params the hook built for the last request.
const lastQueryParams = (): any => {
    const [, queryParams] = mockMakeUrlWithParams.mock.calls.at(-1) ?? [];
    return queryParams;
};

describe('useFormsDropdown', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockMakeUrlWithParams.mockReturnValue('/api/forms/dropdown/');
        mockApiResponse([]);
    });

    it('hits the dedicated dropdown endpoint', () => {
        renderHook(() => useFormsDropdown());

        expect(mockMakeUrlWithParams).toHaveBeenCalledWith(
            '/api/forms/dropdown/',
            expect.any(Object),
        );
    });

    it('defaults the order to name', () => {
        renderHook(() => useFormsDropdown());

        expect(lastQueryParams().order).toBe('name');
    });

    it('forwards params (e.g. filters) to the query', () => {
        renderHook(() =>
            useFormsDropdown({
                params: { orgUnitTypeId: 123, search: 'abc' },
            }),
        );

        const queryParams = lastQueryParams();
        expect(queryParams.orgUnitTypeId).toBe(123);
        expect(queryParams.search).toBe('abc');
    });

    it('lets params override the default order', () => {
        renderHook(() => useFormsDropdown({ params: { order: '-name' } }));

        expect(lastQueryParams().order).toBe('-name');
    });

    it('returns the value/label options unchanged (no mapping)', () => {
        mockApiResponse([
            { value: 1, label: 'Alpha' },
            { value: 2, label: 'Beta' },
        ]);

        const { result } = renderHook(() => useFormsDropdown());

        expect(result.current.data).toEqual([
            { value: 1, label: 'Alpha' },
            { value: 2, label: 'Beta' },
        ]);
    });
});
