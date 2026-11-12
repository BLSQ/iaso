import React from 'react';
import { fireEvent, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../tests/helpers';
import EventTrackerProgramForm from './EventTrackerProgramForm';

const program = {
    id: 'programBelgium',
    name: 'Belgium households',
    trackedEntityType: {
        id: 'tetPerson',
        trackedEntityTypeAttributes: [
            { trackedEntityAttribute: { id: 'teaNationalId', name: 'ID' } },
            { trackedEntityAttribute: { id: 'teaPassport', name: 'Passport' } },
        ],
    },
};
const relationshipType = { id: 'rtHousehold', name: 'Household member' };
// program returned by the program search
let pickedProgram: Record<string, any> = program;

// no DHIS2 call: picks a fixed program or relationship type
vi.mock('./Dhis2SearchComponent', () => ({
    default: ({
        resourceName,
        onChange,
    }: {
        resourceName: string;
        onChange: (name: string, value: Record<string, any>) => void;
    }) => (
        <button
            type="button"
            onClick={() =>
                onChange(
                    resourceName,
                    resourceName === 'programs'
                        ? pickedProgram
                        : relationshipType,
                )
            }
        >
            pick {resourceName}
        </button>
    ),
}));

const savedMapping = {
    type: 'repeat',
    program_id: 'programFrance',
    program_name: 'France households',
    tracked_entity_type: 'tetFrance',
    tracked_entity_identifier: 'teaFrance',
    relationship_type: 'rtFrance',
    relationship_type_name: 'Lives with',
};

const renderForm = (repeatGroupMapping?: Record<string, any>[]) => {
    const onConfirmed = vi.fn();
    renderWithThemeAndIntlProvider(
        <EventTrackerProgramForm
            dataSourceId={1}
            repeatGroupMapping={repeatGroupMapping}
            onConfirmedQuestionMapping={onConfirmed}
        />,
    );
    return onConfirmed;
};

// "label: value dhis2Id" of each field of a card
const chooseIdentifier = (name: string) => {
    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(within(screen.getByRole('listbox')).getByText(name));
};

const proposedIdentifier = () =>
    screen.getAllByRole('group', { name: 'Tracked entity identifier' })[1]
        .children[1].textContent;

const cardFields = (title: string) => {
    const card = screen.getByText(title).closest('.MuiPaper-root');
    return within(card as HTMLElement)
        .getAllByRole('group')
        .map(field => {
            const [label, value, dhis2Id] = Array.from(field.children).map(
                child => child.textContent?.trim(),
            );
            return [`${label}: ${value}`, dhis2Id].filter(Boolean).join(' ');
        });
};

describe('EventTrackerProgramForm', () => {
    afterEach(() => {
        pickedProgram = program;
    });

    it('shows the current repeat group mapping', () => {
        renderForm([savedMapping]);

        expect(cardFields('Current mapping')).toEqual([
            'Program: France households programFrance',
            'Tracked entity type: tetFrance',
            'Tracked entity identifier: teaFrance',
            'Relationship type: Lives with rtFrance',
        ]);
    });

    it('shows a not mapped repeat group', () => {
        renderForm(undefined);

        expect(cardFields('Current mapping')[0]).toBe('Program: Not mapped');
    });

    it('confirms the proposed program, identifier and relationship', () => {
        const onConfirmed = renderForm(undefined);
        expect(screen.queryByText('Proposed mapping')).toBeNull();

        fireEvent.click(screen.getByText('pick programs'));
        chooseIdentifier('ID');
        fireEvent.click(screen.getByText('pick relationshipTypes'));

        expect(cardFields('Change the mapping')).toEqual([
            'Program: Belgium households programBelgium',
            'Tracked entity type: tetPerson',
            'Tracked entity identifier: teaNationalId',
            'Relationship type: Household member rtHousehold',
        ]);
        fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
        expect(onConfirmed).toHaveBeenCalledWith([
            {
                type: 'repeat',
                program_id: 'programBelgium',
                program_name: 'Belgium households',
                tracked_entity_type: 'tetPerson',
                tracked_entity_identifier: 'teaNationalId',
                relationship_type: 'rtHousehold',
                relationship_type_name: 'Household member',
            },
        ]);
    });

    it('proposes the identifier changed after the relationship type', () => {
        const onConfirmed = renderForm(undefined);
        fireEvent.click(screen.getByText('pick programs'));
        chooseIdentifier('ID');
        fireEvent.click(screen.getByText('pick relationshipTypes'));

        chooseIdentifier('Passport');

        expect(proposedIdentifier()).toBe('teaPassport');
        fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
        expect(onConfirmed).toHaveBeenCalledWith([
            expect.objectContaining({
                tracked_entity_identifier: 'teaPassport',
            }),
        ]);
    });

    it('accepts the relationship type before the program', () => {
        renderForm(undefined);

        fireEvent.click(screen.getByText('pick relationshipTypes'));
        expect(screen.queryByText('Proposed mapping')).toBeNull();

        fireEvent.click(screen.getByText('pick programs'));
        chooseIdentifier('ID');
        expect(cardFields('Change the mapping')).toEqual([
            'Program: Belgium households programBelgium',
            'Tracked entity type: tetPerson',
            'Tracked entity identifier: teaNationalId',
            'Relationship type: Household member rtHousehold',
        ]);
    });

    it('asks the identifier again for another program', () => {
        renderForm(undefined);
        fireEvent.click(screen.getByText('pick programs'));
        chooseIdentifier('ID');
        fireEvent.click(screen.getByText('pick relationshipTypes'));
        expect(screen.getByText('Proposed mapping')).toBeInTheDocument();

        fireEvent.click(screen.getByText('pick programs'));

        expect(screen.queryByText('Proposed mapping')).toBeNull();
    });

    it('offers no identifier for a program without tracked entity type', () => {
        pickedProgram = { id: 'programFrance', name: 'France events' };
        renderForm(undefined);

        fireEvent.click(screen.getByText('pick programs'));
        fireEvent.mouseDown(screen.getByRole('combobox'));

        expect(screen.queryByRole('option')).toBeNull();
        expect(screen.queryByText('Proposed mapping')).toBeNull();
    });
});
