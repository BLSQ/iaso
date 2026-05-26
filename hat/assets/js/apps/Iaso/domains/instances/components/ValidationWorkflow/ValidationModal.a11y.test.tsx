import React, { act } from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { IntlProvider } from 'react-intl';
import { describe, it, expect } from 'vitest';
import { renderWithTheme } from '../../../../../../tests/helpers';
import {
    ValidateNodeRejectModal,
    ValidateNodeApproveModal,
    ValidateNodeRejectByPassModal,
    ValidateNodeApproveByPassModal,
} from './ValidationModal';

describe('ValidationModals accessibility', () => {
    it('renders ValidateNodeRejectModal fields without accessibility violations', async () => {
        const { container } = renderWithTheme(
            <IntlProvider locale={'en'} messages={{}}>
                <ValidateNodeRejectModal instanceId={1} nodeId={1} />
            </IntlProvider>,
        );

        const usrEvent = userEvent.setup();

        await act(async () => {
            await usrEvent.click(screen.getByRole('button'));
        });

        await waitFor(() => {
            expect(screen.getByRole('dialog')).toBeVisible();
            expect(screen.getByText('Comment')).toBeInTheDocument();
        });

        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });

    it('renders ValidateNodeApproveModal fields without accessibility violations', async () => {
        const { container } = renderWithTheme(
            <IntlProvider locale={'en'} messages={{}}>
                <ValidateNodeApproveModal instanceId={1} nodeId={1} />
            </IntlProvider>,
        );

        const usrEvent = userEvent.setup();

        await act(async () => {
            await usrEvent.click(screen.getByRole('button'));
        });

        await waitFor(() => {
            expect(screen.getByRole('dialog')).toBeVisible();
            expect(screen.getByText('Comment')).toBeInTheDocument();
        });

        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });

    it('renders ValidateNodeRejectByPassModal fields without accessibility violations', async () => {
        const { container } = renderWithTheme(
            <IntlProvider locale={'en'} messages={{}}>
                <ValidateNodeRejectByPassModal instanceId={1} nodeSlug={'1'} />
            </IntlProvider>,
        );

        const usrEvent = userEvent.setup();

        await act(async () => {
            await usrEvent.click(screen.getByRole('button'));
        });

        await waitFor(() => {
            expect(screen.getByRole('dialog')).toBeVisible();
            expect(screen.getByText('Comment')).toBeInTheDocument();
        });

        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });

    it('renders ValidateNodeApproveByPassModal fields without accessibility violations', async () => {
        const { container } = renderWithTheme(
            <IntlProvider locale={'en'} messages={{}}>
                <ValidateNodeApproveByPassModal instanceId={1} nodeSlug={'1'} />
            </IntlProvider>,
        );

        const usrEvent = userEvent.setup();

        await act(async () => {
            await usrEvent.click(screen.getByRole('button'));
        });

        await waitFor(() => {
            expect(screen.getByRole('dialog')).toBeVisible();
            expect(screen.getByText('Comment')).toBeInTheDocument();
        });

        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });
});
