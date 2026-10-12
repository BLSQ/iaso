import { describe, expect, it } from 'vitest';
import { EditorQuestion } from 'Iaso/api/scenarios';
import {
    answersFromSubmission,
    EditorStep,
    fromDefinition,
    isPickOrgUnit,
    pickedOrgUnitResult,
    searchAllowsRegistering,
    toDefinition,
} from './utils';

const question = (name: string): EditorQuestion => ({
    name,
    label: name,
    type: 'text',
    required: false,
    relevant: '',
    choices: [],
});

// a web-forms submission of the anthropometry form, prefilled from the child
const SUBMISSION = `<?xml version="1.0"?>
<data xmlns:jr="http://openrosa.org/javarosa" id="anthropometry" version="1">
  <_first_name>Amina</_first_name>
  <_visits__int__>0</_visits__int__>
  <group><muac>12.0</muac></group>
  <oedema>yes</oedema>
  <comment></comment>
  <visit_number>1</visit_number>
  <meta><instanceID>uuid:1</instanceID></meta>
</data>`;

describe('answersFromSubmission', () => {
    it('keeps what the person answered: questions to answer, not empty, inside groups too', () => {
        const questions = ['muac', 'oedema', 'comment'].map(question);

        expect(answersFromSubmission(SUBMISSION, questions, {})).toEqual({
            muac: '12.0',
            oedema: 'yes',
        });
    });

    it("leaves out calculates and the prefilled values the person didn't change", () => {
        const questions = ['_first_name', 'muac', 'oedema'].map(question);

        expect(
            answersFromSubmission(SUBMISSION, questions, {
                _first_name: 'Amina',
            }),
        ).toEqual({
            muac: '12.0',
            oedema: 'yes',
        });
        // changed: an answer
        expect(
            answersFromSubmission(SUBMISSION, questions, {
                _first_name: 'Jules',
            }),
        ).toEqual({
            _first_name: 'Amina',
            muac: '12.0',
            oedema: 'yes',
        });
    });
});

describe('scenario file', () => {
    const steps: EditorStep[] = [
        {
            form: 'child_registration',
            description: 'Registered',
            at: null,
            answers: { first_name: 'Amina' },
            expect: { next_forms: ['anthropometry'] },
            search: { qr_code: 'CARD-0001' },
        },
        {
            form: 'otp_admission',
            description: '',
            at: '2026-10-22T08:30:00',
            answers: { admitted: 'yes' },
            expect: { refused: [{ question: 'admitted', code: 'CONSTRAINT' }] },
            force: true,
            search: {},
        },
    ];

    it('writes the steps as a scenario file: no date for the day of the run, force and search only when set', () => {
        const definition = toDefinition(
            'Oedema leads to OTP',
            'Checks OTP',
            steps,
        );

        expect(definition).toEqual({
            format: 'iaso-scenarios/1',
            kind: 'entity',
            name: 'Oedema leads to OTP',
            description: 'Checks OTP',
            steps: [
                {
                    form: 'child_registration',
                    description: 'Registered',
                    answers: { first_name: 'Amina' },
                    expect: { next_forms: ['anthropometry'] },
                    search: { qr_code: 'CARD-0001' },
                },
                {
                    form: 'otp_admission',
                    description: '',
                    at: '2026-10-22T08:30:00',
                    answers: { admitted: 'yes' },
                    expect: {
                        refused: [{ question: 'admitted', code: 'CONSTRAINT' }],
                    },
                    force: true,
                },
            ],
        });
    });

    it('reads back the steps it wrote', () => {
        const read = fromDefinition(
            toDefinition('Oedema leads to OTP', '', steps),
        );

        expect(
            read.map(step => [step.form, step.at, step.answers, step.force]),
        ).toEqual([
            ['child_registration', null, { first_name: 'Amina' }, undefined],
            ['otp_admission', '2026-10-22T08:30:00', { admitted: 'yes' }, true],
        ]);
        expect(read.map(step => step.search)).toEqual([
            { qr_code: 'CARD-0001' },
            undefined,
        ]);
        expect(read[1].expect.refused).toEqual([
            { question: 'admitted', code: 'CONSTRAINT' },
        ]);
    });

    it("reads nothing from a file it can't read", () => {
        expect(fromDefinition({ steps: 'not a list' })).toEqual([]);
        expect(fromDefinition(null)).toEqual([]);
    });
});

describe('searchAllowsRegistering', () => {
    const questions = [{ name: 'qr_code' }, { name: 'code_menage' }];

    it('needs every question answered when the app prevents adding without them', () => {
        expect(
            searchAllowsRegistering(questions, true, {
                qr_code: 'CARD-0001',
                code_menage: '12',
            }),
        ).toBe(true);
        expect(
            searchAllowsRegistering(questions, true, {
                qr_code: 'CARD-0001',
                code_menage: '  ',
            }),
        ).toBe(false);
        expect(searchAllowsRegistering(questions, true, {})).toBe(false);
    });

    it('lets the app register with an empty search otherwise', () => {
        expect(searchAllowsRegistering(questions, false, {})).toBe(true);
    });
});

describe('pick_ou, as the app answers it', () => {
    const bo = {
        id: 2,
        name: 'Bo',
        parent_id: 1,
        org_unit_type_id: 5,
        latitude: 7.96,
        longitude: null,
        parent: { id: 1, name: 'Sierra Leone', parent: null },
    };

    it('recognises the action whatever the app id', () => {
        expect(isPickOrgUnit('org.bluesquare.iaso.action.pick_ou')).toBe(true);
        expect(isPickOrgUnit('iaso.action.pick_entity')).toBe(false);
    });

    it("renames the app's fields by map, the ancestors as path, the empty ones left out", () => {
        expect(
            pickedOrgUnitResult(bo, {
                map: 'id:ou_id;name:ou_name;path:ou_path',
            }),
        ).toEqual({
            ou_id: '2',
            ou_name: 'Bo',
            ou_path: 'Sierra Leone',
            parentId: '1',
            orgUnitTypeId: '5',
            latitude: '7.96',
        });
    });

    it("keeps the app's names without map", () => {
        expect(
            pickedOrgUnitResult({ id: 1, name: 'Sierra Leone' }, {}),
        ).toEqual({
            id: '1',
            name: 'Sierra Leone',
        });
    });
});
