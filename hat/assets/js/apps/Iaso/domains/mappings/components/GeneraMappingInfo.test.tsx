import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { UseMutationResult } from 'react-query';
import { describe, expect, it, vi } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../tests/helpers';
import { ApplyUpdateVariables, QuestionStatus } from '../types';
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

// only mutate is used by the component
const mockApplyUpdate = () =>
    ({ mutate: vi.fn() }) as unknown as UseMutationResult<
        unknown,
        unknown,
        ApplyUpdateVariables
    >;

const renderInfo = (
    onNextUnmapped?: () => void,
    applyUpdate = mockApplyUpdate(),
) =>
    renderWithThemeAndIntlProvider(
        <GeneraMappingInfo
            currentMappingVersion={mappingVersion}
            applyUpdate={applyUpdate}
            statusCounts={statusCounts}
            onNextUnmapped={onNextUnmapped}
        />,
    );

describe('GeneraMappingInfo', () => {
    it('saves the event date source of the mapping version', () => {
        const applyUpdate = mockApplyUpdate();
        renderInfo(undefined, applyUpdate);
        fireEvent.click(screen.getByRole('button', { name: 'Update' }));
        expect(applyUpdate.mutate).toHaveBeenCalledWith({
            mappingVersionId: 12,
            payload: { event_date_source: 'FROM_SUBMISSION_CREATED_AT' },
        });
    });

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
