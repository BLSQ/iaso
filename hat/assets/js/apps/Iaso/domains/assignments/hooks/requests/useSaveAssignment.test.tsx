import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { QueryClient, QueryClientProvider } from 'react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ASSIGNMENTS_API_URL } from '../../constants/api';
import { saveAssignment, useSaveAssignment } from './useSaveAssignment';

const { mockPostRequest, mockPatchRequest } = vi.hoisted(() => ({
    mockPostRequest: vi.fn(),
    mockPatchRequest: vi.fn(),
}));

vi.mock('Iaso/libs/Api', () => ({
    postRequest: (...args: unknown[]) => mockPostRequest(...args),
    patchRequest: (...args: unknown[]) => mockPatchRequest(...args),
}));

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
        <IntlProvider locale="en" messages={{}}>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </IntlProvider>
    );
    Wrapper.displayName = 'TestQueryClientWrapper';
    return Wrapper;
};

describe('saveAssignment', () => {
    beforeEach(() => {
        mockPostRequest.mockReset();
        mockPatchRequest.mockReset();
    });

    it('creates a new assignment with POST when no id is provided', async () => {
        mockPostRequest.mockResolvedValue({ id: 99 });
        const payload = {
            planning: 42,
            org_unit: 10,
            user: 5,
        };

        await saveAssignment(payload);

        expect(mockPostRequest).toHaveBeenCalledWith(
            ASSIGNMENTS_API_URL,
            payload,
        );
        expect(mockPatchRequest).not.toHaveBeenCalled();
    });

    it('updates an existing assignment with PATCH when an id is provided', async () => {
        mockPatchRequest.mockResolvedValue({});
        const payload = {
            id: 12,
            planning: 42,
            org_unit: 10,
            user: null,
        };

        await saveAssignment(payload);

        expect(mockPatchRequest).toHaveBeenCalledWith(
            `${ASSIGNMENTS_API_URL}12/`,
            payload,
        );
        expect(mockPostRequest).not.toHaveBeenCalled();
    });
});

describe('useSaveAssignment', () => {
    beforeEach(() => {
        mockPostRequest.mockReset();
        mockPatchRequest.mockReset();
        mockPostRequest.mockResolvedValue({ id: 1 });
        mockPatchRequest.mockResolvedValue({});
    });

    it('assigns a user to an org unit', async () => {
        const selectedUser = {
            id: 5,
            username: 'john',
            first_name: 'John',
            last_name: 'Doe',
            color: '#000',
            iaso_profile_id: 1,
        };

        const { result } = renderHook(
            () =>
                useSaveAssignment({
                    planningId: '42',
                    assignments: { assignments: [], allAssignments: [] },
                    selectedUser,
                }),
            { wrapper: createWrapper() },
        );

        await act(async () => {
            result.current.handleSaveAssignment(10);
        });

        expect(mockPostRequest).toHaveBeenCalledWith(ASSIGNMENTS_API_URL, {
            planning: 42,
            org_unit: 10,
            id: undefined,
            user: 5,
        });
    });

    it('unassigns a user when clicking the same assignee again', async () => {
        const selectedUser = {
            id: 5,
            username: 'john',
            first_name: 'John',
            last_name: 'Doe',
            color: '#000',
            iaso_profile_id: 1,
        };
        const assignments = {
            assignments: [],
            allAssignments: [
                {
                    id: 12,
                    planning: 42,
                    org_unit: 10,
                    user: 5,
                    team: 0,
                    org_unit_details: {
                        id: 10,
                        name: 'OU',
                        geo_json: null,
                        latitude: null,
                        longitude: null,
                    },
                },
            ],
        };

        const { result } = renderHook(
            () =>
                useSaveAssignment({
                    planningId: '42',
                    assignments,
                    selectedUser,
                }),
            { wrapper: createWrapper() },
        );

        await act(async () => {
            result.current.handleSaveAssignment(10);
        });

        expect(mockPatchRequest).toHaveBeenCalledWith(
            `${ASSIGNMENTS_API_URL}12/`,
            {
                planning: 42,
                org_unit: 10,
                id: 12,
                user: null,
            },
        );
    });

    it('assigns a team to an org unit', async () => {
        const selectedTeam = { id: 9, name: 'Team', color: '#fff' };

        const { result } = renderHook(
            () =>
                useSaveAssignment({
                    planningId: '42',
                    assignments: { assignments: [], allAssignments: [] },
                    selectedTeam,
                }),
            { wrapper: createWrapper() },
        );

        await act(async () => {
            result.current.handleSaveAssignment(10);
        });

        expect(mockPostRequest).toHaveBeenCalledWith(ASSIGNMENTS_API_URL, {
            planning: 42,
            org_unit: 10,
            id: undefined,
            team: 9,
        });
    });
});
