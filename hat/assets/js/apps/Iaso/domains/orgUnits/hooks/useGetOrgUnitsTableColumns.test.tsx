import React, { ReactNode } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { renderHook } from '@testing-library/react';
import { theme } from 'bluesquare-components';
import { describe, it, expect, vi } from 'vitest';
import { QueryClientWrapperWithIntlProvider } from '../../../../../tests/helpers';
import { Search } from '../types/search';
import { DEFAULT_ORG_UNIT_COLUMNS } from './requests/useGetOrgUnits';
import { useGetOrgUnitsTableColumns } from './useGetOrgUnitsTableColumns';

// avoids fetching /api/validationstatus/
vi.mock('../utils', () => ({ useGetStatusMessage: () => vi.fn() }));

const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientWrapperWithIntlProvider>
        <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </QueryClientWrapperWithIntlProvider>
);

describe('useGetOrgUnitsTableColumns', () => {
    it('has an unsortable Parents column requesting the parent field, hidden by default', () => {
        const { result } = renderHook(
            () => useGetOrgUnitsTableColumns([{} as Search]),
            { wrapper },
        );

        const parentsColumn = result.current.find(
            column => column.accessor === 'parent',
        );
        expect(parentsColumn).toMatchObject({
            Header: 'Parents',
            sortable: false,
        });
        expect(DEFAULT_ORG_UNIT_COLUMNS).not.toContain('parent');
    });
});
