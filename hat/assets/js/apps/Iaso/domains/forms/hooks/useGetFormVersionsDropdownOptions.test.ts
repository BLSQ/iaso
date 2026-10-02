import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useGetFormVersionsDropdownOptions } from './useGetFormVersionsDropdownOptions';

const { mockUseSnackQuery, mockGetRequest } = vi.hoisted(() => ({
    mockUseSnackQuery: vi.fn(),
    mockGetRequest: vi.fn(),
}));

vi.mock('../../../libs/apiHooks', () => ({
    useSnackQuery: mockUseSnackQuery,
}));

vi.mock('../../../libs/Api', () => ({
    getRequest: mockGetRequest,
}));

describe('useGetFormVersionsDropdownOptions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseSnackQuery.mockReturnValue({
            data: [],
            isFetching: false,
        });
    });

    it('disables query and omits form_ids when formIds is not provided', () => {
        renderHook(() => useGetFormVersionsDropdownOptions());

        expect(mockUseSnackQuery).toHaveBeenCalledWith(
            expect.objectContaining({
                queryKey: ['formVersionsDropdownOptions', undefined],
                options: expect.objectContaining({
                    enabled: false,
                    keepPreviousData: true,
                }),
            }),
        );
    });

    it('enables query and includes form_ids when formIds is provided', () => {
        renderHook(() => useGetFormVersionsDropdownOptions('1,2'));

        expect(mockUseSnackQuery).toHaveBeenCalledWith(
            expect.objectContaining({
                queryKey: ['formVersionsDropdownOptions', '1,2'],
                options: expect.objectContaining({
                    enabled: true,
                    keepPreviousData: true,
                }),
            }),
        );

        const queryConfig = mockUseSnackQuery.mock.calls[0][0];
        queryConfig.queryFn();
        expect(mockGetRequest).toHaveBeenCalledWith(
            '/api/formversions/?order=form__name,-version_id&fields=id,version_id,form_id,form_name,full_name&form_ids=1,2',
        );
    });

    it('normalizes form_ids order and whitespace in queryKey and queryFn', () => {
        renderHook(() => useGetFormVersionsDropdownOptions(' 2, 1 '));

        expect(mockUseSnackQuery).toHaveBeenCalledWith(
            expect.objectContaining({
                queryKey: ['formVersionsDropdownOptions', '1,2'],
                options: expect.objectContaining({
                    enabled: true,
                }),
            }),
        );

        const queryConfig = mockUseSnackQuery.mock.calls[0][0];
        queryConfig.queryFn();
        expect(mockGetRequest).toHaveBeenCalledWith(
            '/api/formversions/?order=form__name,-version_id&fields=id,version_id,form_id,form_name,full_name&form_ids=1,2',
        );
    });

    it('transforms api results into dropdown options in select callback', () => {
        renderHook(() => useGetFormVersionsDropdownOptions('1'));

        const queryConfig = mockUseSnackQuery.mock.calls[0][0];
        const select = queryConfig.options.select;

        const apiData = {
            form_versions: [
                {
                    id: 10,
                    version_id: '1',
                    form_id: 1,
                    form_name: 'Form A',
                    full_name: 'Form A - V1',
                },
                {
                    id: 20,
                    version_id: '2',
                    form_id: 1,
                    form_name: 'Form A',
                    full_name: 'Form A - V2',
                },
            ],
        };

        const result = select(apiData);
        expect(result).toEqual([
            {
                label: 'V1 - Form A',
                value: '10',
                formName: 'Form A',
                versionId: '1',
                formId: 1,
            },
            {
                label: 'V2 - Form A',
                value: '20',
                formName: 'Form A',
                versionId: '2',
                formId: 1,
            },
        ]);

        expect(select(null)).toEqual([]);
    });
});
