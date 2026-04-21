const { mockRestoreRequest, mockUseSnackMutation } = vi.hoisted(() => ({
    mockRestoreRequest: vi.fn(),
    mockUseSnackMutation: vi.fn(),
}));

vi.mock('../../../libs/Api', () => ({
    restoreRequest: mockRestoreRequest,
}));

vi.mock('../../../libs/apiHooks', () => ({
    useSnackMutation: mockUseSnackMutation,
}));

describe('useRestoreForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('uses showDeleted so a deleted form can be restored', async () => {
        const { useRestoreForm } = await import('./useRestoreForm');

        useRestoreForm();

        const mutationFn = mockUseSnackMutation.mock.calls[0][0].mutationFn;
        mutationFn(3);

        expect(mockRestoreRequest).toHaveBeenCalledWith(
            '/api/forms/3/?showDeleted=true',
        );
    });
});
