import { describe, expect, it } from 'vitest';
import { EditorQuestion } from 'Iaso/api/scenarios';
import {
    answersFromSubmission,
    EditorStep,
    fromDefinition,
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
        },
        {
            form: 'otp_admission',
            description: '',
            at: '2026-10-22T08:30:00',
            answers: { admitted: 'yes' },
            expect: { refused: [{ question: 'admitted', code: 'CONSTRAINT' }] },
            force: true,
        },
    ];

    it('writes the steps as a scenario file: no date for the day of the run, force only when set', () => {
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
        expect(read[1].expect.refused).toEqual([
            { question: 'admitted', code: 'CONSTRAINT' },
        ]);
    });

    it("reads nothing from a file it can't read", () => {
        expect(fromDefinition({ steps: 'not a list' })).toEqual([]);
        expect(fromDefinition(null)).toEqual([]);
    });
});
