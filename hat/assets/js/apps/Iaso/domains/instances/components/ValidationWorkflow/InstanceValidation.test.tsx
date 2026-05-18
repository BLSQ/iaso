import React from 'react';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { InstanceValidation } from 'Iaso/domains/instances/components/ValidationWorkflow/InstanceValidation';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';

describe('InstanceValidation tests', () => {
    it('renders a no data found alert when validation_status is ""', () => {
        renderWithThemeAndIntlProvider(
            <InstanceValidation
                instanceId={1}
                data={{ validation_status: '' }}
            />,
        );
        expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    it('renders a no data found alert when validation_status is null', () => {
        renderWithThemeAndIntlProvider(
            <InstanceValidation
                instanceId={1}
                data={{ validation_status: null }}
            />,
        );
        expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    it('does not render a no data found alert when validation status is defined', () => {
        renderWithThemeAndIntlProvider(
            <InstanceValidation
                instanceId={1}
                data={{ validation_status: 'APPROVED' }}
            />,
        );
        expect(screen.queryByRole('alert')).toBeNull();
    });
});
