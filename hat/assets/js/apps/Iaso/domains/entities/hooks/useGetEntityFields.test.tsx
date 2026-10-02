import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MODULE_EXTERNAL_STORAGE } from 'Iaso/utils/modules';
import { STORAGES } from 'Iaso/utils/permissions';
import { useGetEntityFields } from './useGetEntityFields';

const {
    mockCurrentUser,
    mockUseCurrentUserHasPermission,
    mockUseGetEntityTypesDropdown,
    mockUseGetPossibleFields,
    mockUseGetFormDescriptor,
    mockUseGetFields,
    mockFormatMessage,
    mockUseCurrentUserHasAccessToModule,
} = vi.hoisted(() => ({
    mockCurrentUser: vi.fn(),
    mockUseCurrentUserHasPermission: vi.fn(),
    mockUseGetEntityTypesDropdown: vi.fn(),
    mockUseGetPossibleFields: vi.fn(),
    mockUseGetFormDescriptor: vi.fn(),
    mockUseGetFields: vi.fn(),
    mockFormatMessage: vi.fn(msg => msg.id || msg),
    mockUseCurrentUserHasAccessToModule: vi.fn(),
}));

vi.mock('bluesquare-components', () => ({
    useSafeIntl: () => ({
        formatMessage: mockFormatMessage,
    }),
}));

vi.mock('Iaso/utils/usersUtils', () => ({
    useCurrentUser: mockCurrentUser,
}));

vi.mock('Iaso/domains/users/utils', () => ({
    useCurrentUserHasAccessToModule: mockUseCurrentUserHasAccessToModule,
    useCurrentUserHasPermission: mockUseCurrentUserHasPermission,
}));

vi.mock('./requests', () => ({
    useGetEntityTypesDropdown: mockUseGetEntityTypesDropdown,
}));

vi.mock('../../forms/hooks/useGetPossibleFields', () => ({
    useGetPossibleFields: mockUseGetPossibleFields,
}));

vi.mock('../../forms/fields/hooks/useGetFormDescriptor', () => ({
    useGetFormDescriptor: mockUseGetFormDescriptor,
}));

vi.mock('./useGetFields', () => ({
    useGetFields: mockUseGetFields,
}));

// --- TESTS ---

describe('useGetEntityFields hook', () => {
    const mockEntity = {
        id: 1,
        uuid: '1234-abcd',
        nfc_cards: 5,
        entity_type: 'type-1',
        attributes: { form_id: 99 },
    } as any;

    const mockDynamicField = {
        label: 'Dynamic Field',
        value: 'Dynamic Value',
        key: 'dyn',
    };

    beforeEach(() => {
        vi.clearAllMocks();

        mockCurrentUser.mockReturnValue({ id: 1, username: 'yoda' });
        mockUseCurrentUserHasPermission.mockReturnValue(true);
        mockUseCurrentUserHasAccessToModule.mockReturnValue(true);

        mockUseGetEntityTypesDropdown.mockReturnValue({
            data: [
                {
                    value: 'type-1',
                    original: { fields_detail_info_view: ['dyn'] },
                },
            ],
        });
        mockUseGetPossibleFields.mockReturnValue({ possibleFields: [] });
        mockUseGetFormDescriptor.mockReturnValue({ data: {} });
        mockUseGetFields.mockReturnValue([mockDynamicField]);
    });

    it('returns isLoading true when entity is undefined', () => {
        const { result } = renderHook(() => useGetEntityFields(undefined));

        expect(result.current.isLoading).toBe(true);
        expect(result.current.fields.length).toBeGreaterThan(0);
    });

    it('returns isLoading true when detailFields length does not match dynamicFields length', () => {
        mockUseGetFields.mockReturnValue([]);

        const { result } = renderHook(() => useGetEntityFields(mockEntity));

        expect(result.current.isLoading).toBe(true);
    });

    it('returns isLoading false when entity exists and lengths match', () => {
        const { result } = renderHook(() => useGetEntityFields(mockEntity));

        expect(result.current.isLoading).toBe(false);
    });

    it('includes nfcCards field when user has both permission and module access', () => {
        const { result } = renderHook(() => useGetEntityFields(mockEntity));

        expect(mockUseCurrentUserHasAccessToModule).toHaveBeenCalledWith(
            MODULE_EXTERNAL_STORAGE,
        );
        expect(mockUseCurrentUserHasPermission).toHaveBeenCalledWith(STORAGES);

        const nfcField = result.current.fields.find(f => f.key === 'nfcCards');
        expect(nfcField).toBeDefined();
        expect(nfcField?.value).toBe('5');
    });

    it('excludes nfcCards field when user lacks module access', () => {
        mockUseCurrentUserHasAccessToModule.mockReturnValue(false);

        const { result } = renderHook(() => useGetEntityFields(mockEntity));

        const nfcField = result.current.fields.find(f => f.key === 'nfcCards');
        expect(nfcField).toBeUndefined();
    });

    it('excludes nfcCards field when user lacks permission', () => {
        mockUseCurrentUserHasPermission.mockReturnValue(false);

        const { result } = renderHook(() => useGetEntityFields(mockEntity));

        const nfcField = result.current.fields.find(f => f.key === 'nfcCards');
        expect(nfcField).toBeUndefined();
    });

    it('uses fallback values for nfc_cards and uuid when they are missing from entity payload', () => {
        const entityWithoutOptionals = {
            id: 2,
            entity_type: 'type-1',
            attributes: { form_id: 99 },
        } as any;

        const { result } = renderHook(() =>
            useGetEntityFields(entityWithoutOptionals),
        );

        const nfcField = result.current.fields.find(f => f.key === 'nfcCards');
        const uuidField = result.current.fields.find(f => f.key === 'uuid');

        expect(nfcField?.value).toBe('0');
        expect(uuidField?.value).toBe('--');
    });

    it('correctly combines dynamic and static fields', () => {
        const { result } = renderHook(() => useGetEntityFields(mockEntity));

        expect(result.current.fields).toHaveLength(3);

        expect(result.current.fields[0]).toEqual(mockDynamicField);

        expect(result.current.fields[1].key).toBe('nfcCards');
        expect(result.current.fields[2].key).toBe('uuid');
    });
});
