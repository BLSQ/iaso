import React from 'react';
import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../tests/helpers';
import { CompareSubmissions } from './index';

const { mockUseParamsObject, mockUseGetInstances } = vi.hoisted(() => ({
    mockUseParamsObject: vi.fn(),
    mockUseGetInstances: vi.fn(),
}));

vi.mock('../../../routing/hooks/useParamsObject', () => ({
    useParamsObject: mockUseParamsObject,
}));

vi.mock('../hooks/requests/useGetInstance', () => ({
    useGetInstances: mockUseGetInstances,
}));

vi.mock('./components/InstanceDetail', () => ({
    default: ({ instanceId }: { instanceId: string }) => (
        <div data-testid="instance-detail">{instanceId}</div>
    ),
}));

vi.mock('../../../components/nav/TopBarComponent', () => ({
    default: ({ title }: { title: string }) => <div>{title}</div>,
}));

vi.mock('bluesquare-components', async importOriginal => {
    const actual =
        await importOriginal<typeof import('bluesquare-components')>();
    return {
        ...actual,
        useSafeIntl: () => ({
            formatMessage: (msg: { defaultMessage?: string; id?: string }) =>
                msg.defaultMessage ?? msg.id ?? '',
        }),
        useGoBack: () => vi.fn(),
    };
});

const loaded = (hiddenFields?: string[]) => ({
    data: { hidden_fields: hiddenFields },
});

describe('CompareSubmissions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseParamsObject.mockReturnValue({
            accountId: '1',
            instanceIds: '28739,28717',
        });
    });

    it('renders one column per compared submission', () => {
        mockUseGetInstances.mockReturnValue([loaded([]), loaded([])]);

        renderWithThemeAndIntlProvider(<CompareSubmissions />);

        expect(mockUseGetInstances).toHaveBeenCalledWith(['28739', '28717']);
        expect(
            screen.getAllByTestId('instance-detail').map(el => el.textContent),
        ).toEqual(['28739', '28717']);
    });

    describe('PII restricted banner', () => {
        it('is shown when some questions of a compared submission are hidden', () => {
            mockUseGetInstances.mockReturnValue([
                loaded([]),
                loaded(['first_name']),
            ]);

            renderWithThemeAndIntlProvider(<CompareSubmissions />);

            expect(
                screen.getByTestId('pii-restricted-banner'),
            ).toHaveTextContent('Some information is hidden');
        });

        it('is not shown when no question of the compared submissions is hidden', () => {
            mockUseGetInstances.mockReturnValue([loaded([]), loaded()]);

            renderWithThemeAndIntlProvider(<CompareSubmissions />);

            expect(
                screen.queryByTestId('pii-restricted-banner'),
            ).not.toBeInTheDocument();
        });

        it('is not shown while the submissions are loading', () => {
            mockUseGetInstances.mockReturnValue([
                { data: undefined },
                { data: undefined },
            ]);

            renderWithThemeAndIntlProvider(<CompareSubmissions />);

            expect(
                screen.queryByTestId('pii-restricted-banner'),
            ).not.toBeInTheDocument();
        });
    });
});
