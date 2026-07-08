import { faker } from '@faker-js/faker';
import { act, renderHook, waitFor } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { vi } from 'vitest';
import { ApiDiffInstancesListParams } from 'Iaso/api/instanceDiff';
import { useApiDiffInstancesList } from 'Iaso/api/instanceDiff/endpoints/submission-diff/submission-diff';
import {
    getApiDiffInstancesListMockHandler,
    getApiDiffInstancesListResponseMock,
    getSubmissionDiffMock,
} from 'Iaso/api/instanceDiff/endpoints/submission-diff/submission-diff.msw';
import {
    QueryClientWrapperWithIntlProvider,
    TestingQueryClient,
} from '../../../tests/helpers';

const server = setupServer(...getSubmissionDiffMock());

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const previousDefaults = TestingQueryClient.getDefaultOptions();

const instanceId = '42';

const mockModifications = getApiDiffInstancesListResponseMock({
    count: 2,
    has_next: false,
    has_previous: false,
    limit: 20,
    page: 1,
    pages: 1,
    results: [
        {
            created_at: '2024-06-01T10:00:00Z',
            content_type: 'iaso.instance',
            object_id: instanceId,
            diff: [{ op: 'replace', path: '/name', value: 'updated' }],
            past_value: { name: 'original' },
            new_value: { name: 'updated' },
            possible_fields: [],
            files: {},
            form_descriptor: undefined,
        },
        {
            created_at: '2024-06-01T09:00:00Z',
            content_type: 'iaso.instance',
            object_id: instanceId,
            diff: [{ op: 'add', path: '/field', value: 'new' }],
            past_value: {},
            new_value: { field: 'new' },
            possible_fields: [],
            files: {},
            form_descriptor: undefined,
        },
    ],
});

describe('Instance diff integration', () => {
    beforeAll(() => {
        TestingQueryClient.setDefaultOptions({
            queries: {
                retry: false,
            },
        });
        faker.seed(1);
    });

    afterEach(() => {
        TestingQueryClient.clear();
    });

    afterAll(() => {
        faker.seed(Date.now());
        TestingQueryClient.setDefaultOptions(previousDefaults);
        vi.clearAllMocks();
    });

    beforeEach(() => {
        vi.clearAllMocks();
        vi.unstubAllEnvs();
    });

    it('is fetching while loading', () => {
        vi.stubEnv('MSW_DELAY', '1000000');

        const { result } = renderHook(
            () => useApiDiffInstancesList(instanceId),
            { wrapper: QueryClientWrapperWithIntlProvider },
        );

        expect(result.current.isFetching).toBe(true);
    });

    it('returns modification diff data', async () => {
        server.use(getApiDiffInstancesListMockHandler(mockModifications));

        const { result } = renderHook(
            () => useApiDiffInstancesList(instanceId),
            { wrapper: QueryClientWrapperWithIntlProvider },
        );

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data).toMatchObject({
            count: 2,
            page: 1,
            pages: 1,
        });
        expect(result.current.data?.results).toHaveLength(2);
        expect(result.current.data?.results?.[0]).toMatchObject({
            content_type: 'iaso.instance',
            object_id: instanceId,
        });
    });

    it('returns empty results when there is no data', async () => {
        server.use(
            getApiDiffInstancesListMockHandler({
                count: 0,
                has_next: false,
                has_previous: false,
                limit: 20,
                page: 1,
                pages: 1,
                results: [],
            }),
        );

        const { result } = renderHook(
            () => useApiDiffInstancesList(instanceId),
            { wrapper: QueryClientWrapperWithIntlProvider },
        );

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data?.results).toEqual([]);
    });

    it('uses the correct query parameters', async () => {
        const mockList = vi.fn();
        server.use(
            getApiDiffInstancesListMockHandler(async info => {
                mockList(info);
                return mockModifications;
            }),
        );

        const params = { page: 2, limit: 10 };

        const { result } = renderHook(
            () => useApiDiffInstancesList(instanceId, params),
            { wrapper: QueryClientWrapperWithIntlProvider },
        );

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(mockList).toHaveBeenCalledTimes(1);

        const url = new URL(mockList.mock.lastCall?.[0].request.url);
        expect(url.pathname).toContain(`/api/diff/instances/${instanceId}/`);
        expect(url.searchParams.get('page')).toBe('2');
        expect(url.searchParams.get('limit')).toBe('10');

        const queryParams = {
            page: Number(url.searchParams.get('page')),
            limit: Number(url.searchParams.get('limit')),
        };
        expect(() =>
            ApiDiffInstancesListParams.parse(queryParams),
        ).not.toThrow();
    });

    it('can refetch data', async () => {
        server.use(getApiDiffInstancesListMockHandler(mockModifications));

        const { result } = renderHook(
            () => useApiDiffInstancesList(instanceId),
            { wrapper: QueryClientWrapperWithIntlProvider },
        );

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        await act(async () => {
            await result.current.refetch();
        });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data?.results).toHaveLength(2);
    });
});
