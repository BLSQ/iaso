import React from 'react';
import { Table, TableBody } from '@mui/material';
import { screen } from '@testing-library/react';
import { WidgetPaperRow } from './WidgetPaperRow';
import { textPlaceholder } from 'Iaso/constants/uiConstants';
import { renderWithTheme } from '../../../../tests/helpers';

const renderWithTable = (ui: React.ReactElement) => {
    return renderWithTheme(
        <Table>
            <TableBody>{ui}</TableBody>
        </Table>
    );
};

describe('WidgetPaperRow', () => {
    it('renders the label', () => {
        renderWithTable(
            <WidgetPaperRow
                field={{ label: 'Name', value: 'John Doe' }}
            />
        );

        expect(screen.getByText('Name')).toBeInTheDocument();
    });

    it('renders the value when provided', () => {
        renderWithTable(
            <WidgetPaperRow
                field={{ label: 'Age', value: 42 }}
            />
        );

        expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('renders the custom placeholder when value is falsy', () => {
        renderWithTable(
            <WidgetPaperRow
                field={{ label: 'Email', value: '' }}
                placeholder="N/A"
            />
        );

        expect(screen.getByText('N/A')).toBeInTheDocument();
    });

    it('renders the default placeholder when value is falsy and no placeholder is provided', () => {
        renderWithTable(
            <WidgetPaperRow
                field={{ label: 'Phone', value: null }}
            />
        );

        expect(screen.getByText(textPlaceholder)).toBeInTheDocument();
    });

    it('renders the default placeholder when value is undefined and no placeholder is provided', () => {
        renderWithTable(
            <WidgetPaperRow
                field={{ label: 'Phone', value: undefined }}
            />
        );

        expect(screen.getByText(textPlaceholder)).toBeInTheDocument();
    });
});