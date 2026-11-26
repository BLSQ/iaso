import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { textPlaceholder } from 'bluesquare-components';
import { describe, it, expect } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../tests/helpers';
import { OrgUnit, ParentOrgUnit } from '../types/orgUnit';
import { OrgUnitParentsCell } from './OrgUnitParentsCell';

const parent = (
    id: number,
    name: string,
    orgUnitTypeName: string,
    grandParent?: ParentOrgUnit,
): ParentOrgUnit =>
    ({
        id,
        name,
        org_unit_type_name: orgUnitTypeName,
        parent: grandParent,
    }) as ParentOrgUnit;

const orgUnitWithParent = (directParent?: ParentOrgUnit): OrgUnit =>
    ({ id: 100, name: 'Mons health center', parent: directParent }) as OrgUnit;

const tooltipLines = (tooltip: HTMLElement): (string | null)[] =>
    Array.from(tooltip.querySelectorAll('.MuiBox-root')).map(
        line => line.textContent,
    );

// Belgium > Hainaut > Mons > Mons health center
const monsHealthCenter = orgUnitWithParent(
    parent(
        3,
        'Mons',
        'District',
        parent(2, 'Hainaut', 'Province', parent(1, 'Belgium', 'Country')),
    ),
);

describe('OrgUnitParentsCell', () => {
    it('shows all the parents, top level first', () => {
        renderWithThemeAndIntlProvider(
            <OrgUnitParentsCell orgUnit={monsHealthCenter} />,
        );

        expect(
            screen.getByText('Belgium > Hainaut > Mons'),
        ).toBeInTheDocument();
    });

    it('shows the placeholder when the org unit has no parent', () => {
        renderWithThemeAndIntlProvider(
            <OrgUnitParentsCell orgUnit={orgUnitWithParent()} />,
        );

        expect(screen.getByText(textPlaceholder)).toBeInTheDocument();
    });

    it('shows the org unit type of a parent without name', async () => {
        renderWithThemeAndIntlProvider(
            <OrgUnitParentsCell
                orgUnit={orgUnitWithParent(
                    parent(3, '', 'District', parent(1, 'Belgium', 'Country')),
                )}
            />,
        );

        await userEvent.hover(screen.getByText('Belgium > District'));

        expect(tooltipLines(await screen.findByRole('tooltip'))).toEqual([
            'Belgium (Country)',
            `${textPlaceholder} (District)`,
        ]);
    });

    it('lists the parents with their org unit type in the tooltip', async () => {
        renderWithThemeAndIntlProvider(
            <OrgUnitParentsCell orgUnit={monsHealthCenter} />,
        );

        await userEvent.hover(screen.getByText('Belgium > Hainaut > Mons'));

        const tooltip = await screen.findByRole('tooltip');
        expect(
            Array.from(tooltip.querySelectorAll('.MuiBox-root')).map(
                line => line.textContent,
            ),
        ).toEqual([
            'Belgium (Country)',
            'Hainaut (Province)',
            'Mons (District)',
        ]);
    });

    it('omits the type in the tooltip when the parent has none', async () => {
        renderWithThemeAndIntlProvider(
            <OrgUnitParentsCell
                orgUnit={orgUnitWithParent(parent(3, 'Mons', ''))}
            />,
        );

        await userEvent.hover(screen.getByText('Mons'));

        const tooltip = await screen.findByRole('tooltip');
        expect(tooltip).toHaveTextContent(/^Mons$/);
    });
});
