import React from 'react';
import { fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { buildQuestionTree } from '../../questionTree';
import { QuestionTree } from './QuestionTree';

// not implemented by jsdom
Element.prototype.scrollIntoView = vi.fn();

const descriptor = {
    name: 'survey',
    type: 'survey',
    children: [
        {
            name: 'belgium',
            type: 'group',
            label: 'Belgique',
            children: [
                { name: 'q1', type: 'integer', label: 'Population' },
                { name: 'q2', type: 'integer', label: 'Écoles' },
            ],
        },
        { name: 'q3', type: 'text', label: 'France' },
    ],
};

const nodes = buildQuestionTree(descriptor, {
    q1: {
        id: 'de1',
        name: 'Population totale',
        valueType: 'NUMBER',
        categoryOptionCombo: 'coc',
    },
    q3: { type: 'neverMapped' },
});

const renderTree = (selectedKey?: string) => {
    const onSelect = vi.fn();
    renderWithThemeAndIntlProvider(
        <QuestionTree
            nodes={nodes}
            selectedKey={selectedKey}
            onSelect={onSelect}
        />,
    );
    return onSelect;
};

const visibleQuestions = () =>
    within(screen.getByRole('tree'))
        .getAllByRole('treeitem')
        .map(item => item.querySelector('.MuiTreeItem-label')?.textContent);

describe('QuestionTree', () => {
    it('shows the questions with their DHIS2 target and the group progress', () => {
        renderTree();
        expect(visibleQuestions()).toEqual([
            'Belgique1 / 2',
            'Population → Population totaleMapped',
            'ÉcolesNot mapped',
            'FranceNever mapped',
        ]);
    });

    it('filters the questions by search', () => {
        renderTree();
        fireEvent.change(screen.getByRole('textbox'), {
            target: { value: 'ecoles' },
        });
        expect(visibleQuestions()).toEqual([
            'Belgique1 / 2',
            'ÉcolesNot mapped',
        ]);
    });

    it('hides a status when its chip is clicked and shows all again', () => {
        renderTree();
        fireEvent.click(screen.getByRole('button', { name: 'Not mapped (1)' }));
        expect(visibleQuestions()).toEqual([
            'Belgique1 / 2',
            'Population → Population totaleMapped',
            'FranceNever mapped',
        ]);
        fireEvent.click(screen.getByRole('button', { name: 'Mapped (1)' }));
        fireEvent.click(
            screen.getByRole('button', { name: 'Never mapped (1)' }),
        );
        expect(screen.queryByRole('tree')).toBeNull();
        expect(
            screen.getByText('No question matches the current filters.'),
        ).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'All (3)' }));
        expect(visibleQuestions()).toHaveLength(4);
    });

    it('selects a question but not a group', () => {
        const onSelect = renderTree();
        fireEvent.click(screen.getByText('Belgique'));
        expect(onSelect).not.toHaveBeenCalled();
        fireEvent.click(screen.getByText('Écoles'));
        expect(onSelect).toHaveBeenCalledWith(
            expect.objectContaining({ name: 'q2' }),
        );
    });

    it('moves to the next and previous visible question', () => {
        const onSelect = renderTree('q2');
        expect(screen.getByText('2 of 3')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /Next question/ }));
        expect(onSelect).toHaveBeenLastCalledWith(
            expect.objectContaining({ name: 'q3' }),
        );
        fireEvent.keyDown(window, { key: 'ArrowUp', altKey: true });
        expect(onSelect).toHaveBeenLastCalledWith(
            expect.objectContaining({ name: 'q1' }),
        );
    });

    it('ignores the arrow keys without Alt', () => {
        const onSelect = renderTree('q2');
        fireEvent.keyDown(window, { key: 'ArrowDown' });
        expect(onSelect).not.toHaveBeenCalled();
    });

    it('disables previous on the first question and next on the last one', () => {
        renderTree('q1');
        expect(
            screen.getByRole('button', { name: /Previous question/ }),
        ).toBeDisabled();
        expect(
            screen.getByRole('button', { name: /Next question/ }),
        ).toBeEnabled();
    });
});
