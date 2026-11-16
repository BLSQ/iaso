import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
    mockGetRequest,
    mockPostRequest,
    mockPutRequest,
    mockIasoFetch,
    mockUseSnackQuery,
    mockUseSnackMutation,
    mockUseMutation,
    mockInvalidateQueries,
    mockOpenSnackBar,
} = vi.hoisted(() => ({
    mockGetRequest: vi.fn(),
    mockPostRequest: vi.fn(),
    mockPutRequest: vi.fn(),
    mockIasoFetch: vi.fn(),
    mockUseSnackQuery: vi.fn(),
    mockUseSnackMutation: vi.fn(),
    mockUseMutation: vi.fn(),
    mockInvalidateQueries: vi.fn(),
    mockOpenSnackBar: vi.fn(),
}));

vi.mock('Iaso/libs/Api', () => ({
    getRequest: mockGetRequest,
    postRequest: mockPostRequest,
    putRequest: mockPutRequest,
    iasoFetch: mockIasoFetch,
}));

vi.mock('Iaso/libs/apiHooks', () => ({
    useSnackQuery: mockUseSnackQuery,
    useSnackMutation: mockUseSnackMutation,
}));

vi.mock('react-query', () => ({
    useMutation: mockUseMutation,
    useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

vi.mock('../../utils/usersUtils', () => ({
    useCurrentUser: () => ({ account: { id: 4 } }),
}));

vi.mock('../../components/snackBars/EventDispatcher', () => ({
    openSnackBar: mockOpenSnackBar,
}));

import {
    convertExportDataToURL,
    csvPreview,
    postGeoPkg,
    postToDHIS2,
    sendDhisOuImporterRequest,
    updateDefaultDataSource,
    useCheckDhis2Mutation,
    useCopyDataSourceVersion,
    useCreateSourceVersion,
    useDataSourceAsDropDown,
    useDataSourceForVersion,
    useDataSourceVersions,
    useOrgUnitTypes,
    usePutSourceVersion,
    useSaveDataSource,
} from './requests';

const queryOf = (url: string) => new URL(url, 'http://localhost').searchParams;

describe('data source requests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('posts the DHIS2 org unit importer body', async () => {
        const body = { source_id: 1, dhis_name: 'DHIS' };
        await sendDhisOuImporterRequest(body);
        expect(mockPostRequest).toHaveBeenCalledWith(
            '/api/dhis2ouimporter/',
            body,
        );
    });

    it('sends a geopackage file separately from the task body', async () => {
        const file = new Blob(['gpkg']);
        await postGeoPkg({ file, name: 'pyramid' });
        expect(mockPostRequest).toHaveBeenCalledWith(
            '/api/tasks/create/importgpkg/',
            { name: 'pyramid' },
            { file },
        );
    });

    it('maps org unit types to dropdown options', () => {
        useOrgUnitTypes();
        const select = mockUseSnackQuery.mock.calls[0][3].select;
        expect(
            select({
                orgUnitTypes: [{ id: 2, name: 'District' }],
            }),
        ).toEqual([{ value: 2, label: 'District' }]);
    });

    it('sorts source versions by name, then number', () => {
        useDataSourceVersions();
        const select = mockUseSnackQuery.mock.calls[0][0].options.select;
        expect(
            select({
                versions: [
                    {
                        id: 2,
                        data_source: 1,
                        data_source_name: 'b',
                        is_default: false,
                        number: 1,
                    },
                    {
                        id: 1,
                        data_source: 1,
                        data_source_name: 'A',
                        is_default: true,
                        number: 2,
                    },
                    {
                        id: 3,
                        data_source: 1,
                        data_source_name: 'a',
                        is_default: false,
                        number: 1,
                    },
                ],
            }).map((version: { id: string }) => version.id),
        ).toEqual(['3', '1', '2']);
    });

    it('turns "all" statuses into empty filters before exporting to DHIS2', async () => {
        await postToDHIS2({
            ref_status: 'all',
            source_status: 'validated',
            source_version_id: 5,
        });
        expect(mockPostRequest).toHaveBeenCalledWith(
            '/api/sourceversions/export_dhis2/',
            {
                ref_status: '',
                source_status: 'validated',
                source_version_id: 5,
            },
        );
    });

    it('builds a csv diff url, repeating array params and skipping empty values', () => {
        const url = convertExportDataToURL({
            org_unit_types: ['1', '2'],
            source: 'dhis',
            empty: null,
            missing: undefined,
        });
        const params = queryOf(url);
        expect(url.startsWith('/api/sourceversions/diff.csv/?')).toBe(true);
        expect(params.getAll('org_unit_types')).toEqual(['1', '2']);
        expect(params.get('source')).toBe('dhis');
        expect(params.get('empty')).toBeNull();
        expect(params.get('missing')).toBeNull();
    });

    it('returns csv text and reports a failed preview', async () => {
        mockIasoFetch.mockResolvedValueOnce({
            text: () => Promise.resolve('a,b'),
        });
        await expect(csvPreview({ source_status: 'all' })).resolves.toBe('a,b');
        expect(mockIasoFetch.mock.calls[0][0]).toContain('source_status=');

        const error = new Error('nope');
        const consoleSpy = vi
            .spyOn(console, 'error')
            .mockImplementation(() => undefined);
        mockIasoFetch.mockRejectedValueOnce(error);
        await csvPreview({ source: 'dhis' });
        expect(mockOpenSnackBar).toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith(
            'Error while fetching CSV:',
            error,
        );
        consoleSpy.mockRestore();
    });

    it('sets the account default version', async () => {
        await updateDefaultDataSource([4, 9]);
        expect(mockPutRequest).toHaveBeenCalledWith(
            '/api/accounts/4/set-default-version/',
            { default_version: 9 },
        );
    });

    it('updates or creates a data source and can mark the default version', async () => {
        const saveMutation = vi.fn();
        const createMutation = vi.fn();
        const defaultMutation = vi.fn();
        const mutations = [saveMutation, createMutation, defaultMutation];
        let call = 0;
        mockUseSnackMutation.mockImplementation(() => {
            const mutateAsync = mutations[call % mutations.length];
            call += 1;
            return { mutateAsync };
        });
        const setFieldErrors = vi.fn();
        const { result } = renderHook(() => useSaveDataSource(setFieldErrors));

        await act(async () => {
            await result.current.saveDataSource({
                is_default_source: { value: true, errors: [] },
                id: { value: 7, errors: [] },
                name: { value: 'Pyramid', errors: [] },
                confirm_default_version_change: { value: true, errors: [] },
                default_version_id: { value: 9, errors: [] },
            });
        });

        expect(saveMutation).toHaveBeenCalledWith({
            id: 7,
            name: 'Pyramid',
            default_version_id: 9,
        });
        expect(createMutation).not.toHaveBeenCalled();
        expect(defaultMutation).toHaveBeenCalledWith([4, 9]);
        expect(mockInvalidateQueries).toHaveBeenCalledWith('sources');
        expect(mockInvalidateQueries).toHaveBeenCalledWith('currentUser');
    });

    it('writes validation errors back onto the form', async () => {
        const saveMutation = vi.fn().mockRejectedValue({
            status: 400,
            details: { name: ['Required'] },
        });
        const mutations = [saveMutation, vi.fn(), vi.fn()];
        let call = 0;
        mockUseSnackMutation.mockImplementation(() => {
            const mutateAsync = mutations[call % mutations.length];
            call += 1;
            return { mutateAsync };
        });
        const setFieldErrors = vi.fn();
        const { result } = renderHook(() => useSaveDataSource(setFieldErrors));

        await act(async () => {
            await result.current.saveDataSource({
                is_default_source: { value: false, errors: [] },
                id: { value: 7, errors: [] },
                name: { value: '', errors: [] },
                default_version_id: { value: null, errors: [] },
            });
        });

        expect(setFieldErrors).toHaveBeenCalledWith('name', ['Required']);
    });

    it('checks DHIS2 credentials and maps field errors', async () => {
        mockUseMutation.mockImplementation((mutationFn, options) => ({
            mutationFn,
            ...options,
        }));
        const setFieldErrors = vi.fn();
        const mutation = useCheckDhis2Mutation(setFieldErrors) as any;
        const form = {
            id: { value: 3 },
            credentials: {
                value: {
                    dhis_url: 'https://dhis',
                    dhis_login: 'admin',
                    dhis_password: 'secret',
                },
            },
        };

        await mutation.mutationFn(form);
        expect(mockPostRequest).toHaveBeenCalledWith(
            '/api/datasources/check_dhis2/',
            {
                data_source: 3,
                dhis2_url: 'https://dhis',
                dhis2_login: 'admin',
                dhis2_password: 'secret',
            },
        );

        mutation.onSuccess();
        expect(setFieldErrors).toHaveBeenCalledWith('credentials', []);

        mutation.onError({
            status: 400,
            details: { dhis2_url: ['Invalid'] },
        });
        expect(setFieldErrors).toHaveBeenCalledWith('credentials_dhis2_url', [
            'Invalid',
        ]);

        mutation.onError({ status: 500, details: {} });
        expect(setFieldErrors).toHaveBeenCalledWith('credentials', [
            'Test failed',
        ]);
    });

    it('finds the data source of a version and maps sources for a dropdown', () => {
        useDataSourceForVersion({ data_source: 2 });
        const selectVersion = mockUseSnackQuery.mock.calls[0][3].select;
        expect(
            selectVersion({
                sources: [
                    { id: 1, name: 'A' },
                    { id: 2, name: 'B' },
                ],
            }),
        ).toEqual({ id: 2, name: 'B' });

        useDataSourceAsDropDown();
        const selectDropdown = mockUseSnackQuery.mock.calls[1][3].select;
        expect(selectDropdown({ sources: [{ id: 2, name: 'B' }] })).toEqual([
            { label: 'B', value: 2 },
        ]);
        expect(selectDropdown(undefined)).toEqual([]);
    });

    it('copies a version and creates or updates a source version', () => {
        useCopyDataSourceVersion();
        mockUseSnackMutation.mock.calls[0][0]({
            dataSourceId: 1,
            dataSourceVersionNumber: 2,
            destinationSourceId: 3,
            destinationVersionNumber: 4,
        });
        expect(mockPostRequest).toHaveBeenCalledWith('/api/copyversion/', {
            source_source_id: 1,
            source_version_number: 2,
            destination_source_id: 3,
            destination_version_number: 4,
            force: false,
        });

        useCreateSourceVersion();
        mockUseSnackMutation.mock.calls[1][0].mutationFn({
            description: 'empty',
            dataSourceId: 3,
        });
        expect(mockPostRequest).toHaveBeenCalledWith('/api/sourceversions/', {
            description: 'empty',
            data_source_id: 3,
        });

        usePutSourceVersion();
        mockUseSnackMutation.mock.calls[2][0]({
            sourceVersionId: 8,
            description: 'edited',
            dataSourceId: 3,
            sourceVersionNumber: 2,
        });
        expect(mockPutRequest).toHaveBeenCalledWith('/api/sourceversions/8/', {
            id: 8,
            description: 'edited',
            data_source: 3,
            number: 2,
        });
    });
});
