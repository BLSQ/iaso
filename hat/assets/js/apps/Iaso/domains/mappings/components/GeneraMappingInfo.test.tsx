import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../tests/helpers';
import { QuestionStatus } from '../types';
import GeneraMappingInfo from './GeneraMappingInfo';

const mappingVersion = {
    id: 12,
    mapping: { mapping_type: 'AGGREGATE' },
    form_version: { version_id: '2024010101' },
    dataset: { id: 'dsBelgium', name: 'Census Belgium' },
    derivate_settings: {},
};

const statusCounts = {
    [QuestionStatus.MAPPED]: 3,
    [QuestionStatus.UNMAPPED]: 2,
    [QuestionStatus.NEVER]: 1,
};

// "label: value" of each LabeledValue, in display order
const fieldTexts = () =>
    screen
        .getAllByRole('group')
        .map(
            field =>
                `${field.getAttribute('aria-label')}: ${field.children[1].textContent}`,
        );

const nextUnmappedButton = () =>
    screen.getByRole('button', { name: 'Next not mapped question' });

const renderInfo = (onNextUnmapped?: () => void) =>
    renderWithThemeAndIntlProvider(
        <GeneraMappingInfo
            currentMappingVersion={mappingVersion}
            applyUpdate={{ mutate: vi.fn() }}
            statusCounts={statusCounts}
            onNextUnmapped={onNextUnmapped}
        />,
    );

describe('GeneraMappingInfo', () => {
    it('shows the mapping and how many questions are in each status', () => {
        renderInfo(vi.fn());
        expect(fieldTexts().slice(-3)).toEqual([
            'Mapped: 3',
            'Not mapped: 2',
            'Never mapped: 1',
        ]);
    });

    it('goes to the next not mapped question', () => {
        const onNextUnmapped = vi.fn();
        renderInfo(onNextUnmapped);
        fireEvent.click(nextUnmappedButton());
        expect(onNextUnmapped).toHaveBeenCalledTimes(1);
    });

    it('disables the next not mapped question once all are mapped', () => {
        renderInfo(undefined);
        expect(nextUnmappedButton()).toBeDisabled();
    });
});
