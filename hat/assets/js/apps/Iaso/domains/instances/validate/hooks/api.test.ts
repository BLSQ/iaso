const { mockPostRequest, mockUseSnackMutation } = vi.hoisted(() => ({
    mockPostRequest: vi.fn(),
    mockUseSnackMutation: vi.fn(),
}));

vi.mock('Iaso/libs/Api', () => ({
    postRequest: mockPostRequest,
}));

vi.mock('Iaso/libs/apiHooks', () => ({
    useSnackMutation: mockUseSnackMutation,
}));

describe('useValidateNode saveNode', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseSnackMutation.mockReturnValue({});
    });

    it('posts to complete endpoint when node is not provided', async () => {
        const { useValidateNode } = await import('./api');

        useValidateNode();

        const mutationFn = mockUseSnackMutation.mock.calls[0][0].mutationFn;
        mutationFn({
            instanceId: '42',
            nodeId: '7',
            node: undefined,
            comment: 'Looks good',
            approved: true,
        });

        expect(mockPostRequest).toHaveBeenCalledWith(
            expect.stringContaining('instance/42/nodes/7/complete/'),
            {
                comment: 'Looks good',
                approved: true,
            },
        );
    });

    it('posts to bypass endpoint when node slug is provided', async () => {
        const { useValidateNode } = await import('./api');

        useValidateNode();

        const mutationFn = mockUseSnackMutation.mock.calls[0][0].mutationFn;
        mutationFn({
            instanceId: '42',
            nodeId: '1',
            node: 'step-a',
            comment: '',
            approved: true,
        });

        expect(mockPostRequest).toHaveBeenCalledWith(
            expect.stringContaining('instance/42/nodes/complete-bypass/'),
            {
                comment: '',
                approved: true,
                node: 'step-a',
            },
        );
    });

    it('strips routing fields from request body', async () => {
        const { useValidateNode } = await import('./api');

        useValidateNode();

        const mutationFn = mockUseSnackMutation.mock.calls[0][0].mutationFn;
        mutationFn({
            instanceId: '42',
            nodeId: '7',
            node: undefined,
            approved: false,
            comment: 'Rejected',
        });

        expect(mockPostRequest.mock.calls[0][1]).not.toHaveProperty(
            'instanceId',
        );
        expect(mockPostRequest.mock.calls[0][1]).not.toHaveProperty('nodeId');
        expect(mockPostRequest.mock.calls[0][1]).not.toHaveProperty('node');
    });

    it('registers submission-validation-status invalidation key', async () => {
        const { useValidateNode } = await import('./api');

        useValidateNode();

        expect(mockUseSnackMutation).toHaveBeenCalledWith(
            expect.objectContaining({
                invalidateQueryKey: [
                    'instance',
                    'submission-validation-status',
                ],
            }),
        );
    });
});
