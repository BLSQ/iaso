import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
    mockGetRequest,
    mockPostRequest,
    mockPatchRequest,
    mockDeleteRequest,
    mockUseSnackQuery,
    mockUseSnackMutation,
    mockUseDeleteTableRow,
} = vi.hoisted(() => ({
    mockGetRequest: vi.fn(),
    mockPostRequest: vi.fn(),
    mockPatchRequest: vi.fn(),
    mockDeleteRequest: vi.fn(),
    mockUseSnackQuery: vi.fn(),
    mockUseSnackMutation: vi.fn(),
    mockUseDeleteTableRow: vi.fn(() => vi.fn()),
}));

vi.mock('../../../../libs/Api', () => ({
    getRequest: mockGetRequest,
    postRequest: mockPostRequest,
    patchRequest: mockPatchRequest,
    deleteRequest: mockDeleteRequest,
}));

vi.mock('../../../../libs/apiHooks', () => ({
    useSnackQuery: mockUseSnackQuery,
    useSnackMutation: mockUseSnackMutation,
}));

vi.mock('Iaso/components/tables/TableWithDeepLink', () => ({
    useDeleteTableRow: mockUseDeleteTableRow,
}));

import { useDeleteGroups, useGetGroups, useSaveGroups } from './requests';

const queryOf = (url: string) => new URL(url, 'http://localhost').searchParams;

describe('useGetGroups', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('sends the list filters and defaults paging', () => {
        useGetGroups({
            pageSize: '20',
            order: 'name',
            page: '2',
            search: 'clinic',
            project_ids: '1,2',
            dataSource: '3',
            version: '4',
        });

        const [queryKey, queryFn, , options] = mockUseSnackQuery.mock.calls[0];
        queryFn();
        const params = queryOf(mockGetRequest.mock.calls[0][0]);

        expect(queryKey[0]).toBe('groups');
        expect(params.get('limit')).toBe('20');
        expect(params.get('order')).toBe('name');
        expect(params.get('page')).toBe('2');
        expect(params.get('search')).toBe('clinic');
        expect(params.get('projectIds')).toBe('1,2');
        expect(params.get('dataSource')).toBe('3');
        expect(params.get('version')).toBe('4');
        expect(options.staleTime).toBe(60000);
    });

    it('falls back to the default page size, order and page', () => {
        useGetGroups({});

        mockUseSnackQuery.mock.calls[0][1]();
        const params = queryOf(mockGetRequest.mock.calls[0][0]);

        expect(params.get('limit')).toBe('10');
        expect(params.get('order')).toBe('id');
        expect(params.get('page')).toBe('1');
        expect(params.get('search')).toBeNull();
    });
});

describe('useSaveGroups', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('patches an existing group and posts a new one', () => {
        useSaveGroups();
        const mutationFn = mockUseSnackMutation.mock.calls[0][0];

        mutationFn({ id: 8, name: 'North' });
        mutationFn({ name: 'South' });

        expect(mockPatchRequest).toHaveBeenCalledWith('/api/groups/8/', {
            id: 8,
            name: 'North',
        });
        expect(mockPostRequest).toHaveBeenCalledWith('/api/groups/', {
            name: 'South',
        });
        expect(mockUseSnackMutation.mock.calls[0][3]).toEqual(['groups']);
    });
});

describe('useDeleteGroups', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deletes by id and wires the table row cleanup', () => {
        const params = { page: '1', pageSize: '10' };
        useDeleteGroups({ params, count: 3 });

        const [{ mutationFn, snackSuccessMessage, snackErrorMsg, options }] =
            mockUseSnackMutation.mock.calls[0];
        mutationFn({ id: 8 });

        expect(mockDeleteRequest).toHaveBeenCalledWith('/api/groups/8/');
        expect(snackSuccessMessage.id).toBe('iaso.snackBar.delete_successful');
        expect(snackErrorMsg.id).toBe('iaso.snackBar.deleteGroupError');
        expect(mockUseDeleteTableRow).toHaveBeenCalledWith(
            expect.objectContaining({
                count: 3,
                params,
                invalidateQueries: ['groups'],
            }),
        );
        expect(options.onSuccess).toBe(
            mockUseDeleteTableRow.mock.results[0].value,
        );
    });
});
