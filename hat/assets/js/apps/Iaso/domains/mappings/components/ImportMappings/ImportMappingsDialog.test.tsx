import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { getMappableQuestions } from '../../importMappings';
import { ImportMappingsDialog } from './ImportMappingsDialog';

const de = (id: string) => ({
    id,
    name: `DE ${id}`,
    valueType: 'NUMBER',
    categoryOptionCombo: 'coc',
    categoryOptionComboName: 'default',
});

const form = { id: 5, name: 'Form' };
const mapping = {
    mapping_type: 'AGGREGATE',
    data_source: { id: 3, name: 'dhis2' },
};

const mappingVersion = {
    id: 1,
    form_version: { id: 10, version_id: '2021111101', form },
    mapping,
    question_mappings: { q1: de('a'), q2: de('b') },
    derivate_settings: { data_set_id: 'ds1' },
};

const sources = [
    mappingVersion,
    {
        id: 2,
        form_version: { id: 9, version_id: '2020100801', form },
        mapping,
        question_mappings: {
            q1: de('a'),
            q2: de('c'),
            q3: de('d'),
            gone: de('e'),
        },
        derivate_settings: { data_set_id: 'ds1' },
        updated_at: 1600000000,
    },
    {
        // other data source: never offered
        id: 3,
        form_version: { id: 8, version_id: '2019', form },
        mapping: { ...mapping, data_source: { id: 4, name: 'other' } },
        question_mappings: { q3: de('z') },
        derivate_settings: { data_set_id: 'ds1' },
    },
];

const { useGetMappingImportSources } = vi.hoisted(() => ({
    useGetMappingImportSources: vi.fn(),
}));
vi.mock('../../hooks/requests/useGetMappingImportSources', () => ({
    useGetMappingImportSources,
}));
useGetMappingImportSources.mockImplementation(() => ({
    data: sources,
    isLoading: false,
}));

const questions = getMappableQuestions({
    name: 'survey',
    type: 'survey',
    children: ['q1', 'q2', 'q3'].map(name => ({
        name,
        type: 'integer',
        label: `Label ${name}`,
    })),
});

describe('ImportMappingsDialog', () => {
    it('compares a previous version and applies the decisions', async () => {
        const onApply = vi.fn().mockResolvedValue(undefined);
        const closeDialog = vi.fn();
        renderWithThemeAndIntlProvider(
            <ImportMappingsDialog
                open
                closeDialog={closeDialog}
                mappingVersion={mappingVersion}
                questions={questions}
                onApply={onApply}
            />,
        );

        // only the versions of the current form are offered
        expect(useGetMappingImportSources).toHaveBeenCalledWith(
            form.id,
            'AGGREGATE',
            true,
        );
        expect(screen.getByText('Version 2020100801')).toBeInTheDocument();
        expect(screen.queryByText('Version 2019')).not.toBeInTheDocument();
        expect(
            screen.getByText('3 / 4 match this version'),
        ).toBeInTheDocument();

        fireEvent.click(screen.getByText('Compare'));

        expect(screen.getByText('Conflicts (1)')).toBeInTheDocument();
        expect(screen.getByText('To add (1)')).toBeInTheDocument();
        expect(screen.getByText('Identical (1)')).toBeInTheDocument();
        expect(screen.getByText('Dropped (1)')).toBeInTheDocument();

        // conflicts are kept by default, only the addition is applied
        expect(screen.getByText('Apply 1 changes')).toBeInTheDocument();
        fireEvent.click(screen.getByText('Overwrite everywhere'));
        fireEvent.click(screen.getByText('Apply 2 changes'));

        await waitFor(() => expect(closeDialog).toHaveBeenCalled());
        expect(onApply).toHaveBeenCalledWith(
            expect.objectContaining({
                changes: { q2: de('c'), q3: de('d') },
            }),
        );
    });

    const renderAndChooseFile = (content: unknown) => {
        renderWithThemeAndIntlProvider(
            <ImportMappingsDialog
                open
                closeDialog={vi.fn()}
                mappingVersion={mappingVersion}
                questions={questions}
                onApply={vi.fn()}
            />,
        );
        const text = JSON.stringify(content);
        const file = new File([text], 'export.json', {
            type: 'application/json',
        });
        // jsdom does not implement Blob.text()
        Object.defineProperty(file, 'text', {
            value: () => Promise.resolve(text),
        });
        fireEvent.change(
            document.querySelector('input[type="file"]') as HTMLInputElement,
            { target: { files: [file] } },
        );
    };

    it('rejects a file of another mapping type', async () => {
        renderAndChooseFile({ mapping_type: 'EVENT', question_mappings: {} });
        expect(
            await screen.findByText(
                'This export was made for another mapping type.',
            ),
        ).toBeInTheDocument();
    });

    it('rejects a file without any valid mapping', async () => {
        renderAndChooseFile({ compilerOptions: { strict: true } });
        expect(
            await screen.findByText(
                'This file contains no mapping valid for a AGGREGATE mapping.',
            ),
        ).toBeInTheDocument();
    });

    it('warns about a file made for another dataset', async () => {
        renderAndChooseFile({
            mapping_type: 'AGGREGATE',
            dataset: { id: 'ds2', name: 'Other dataset' },
            question_mappings: { q1: de('x') },
        });
        expect(await screen.findByText('export.json')).toBeInTheDocument();
        expect(
            screen.getByText(
                'This export was made for another DHIS2 dataset (Other dataset). Check that its data elements belong to this one.',
            ),
        ).toBeInTheDocument();
    });
});
