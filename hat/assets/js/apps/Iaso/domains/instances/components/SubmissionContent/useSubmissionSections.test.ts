import { Descriptor } from '../InstanceFileContentRich';
import {
    buildSubmissionSections,
    filterSubmissionSections,
    getFieldKind,
} from './useSubmissionSections';

const descriptor: Descriptor = {
    name: 'Cartographie',
    type: 'survey',
    children: [
        { name: 'date_collecte', type: 'date', label: 'Date de collecte' },
        {
            name: 'meta',
            type: 'group',
            children: [{ name: 'instanceID', type: 'text' }],
        },
        {
            name: 'superviseur_infos',
            type: 'group',
            label: 'Informations sur le superviseur',
            children: [
                { name: 'nom_superviseur', type: 'text', label: 'Nom' },
                {
                    name: 'sexe_superviseur',
                    type: 'select_one',
                    label: 'Sexe',
                    children: [
                        { name: 'm', type: 'option', label: 'Masculin' },
                        { name: 'f', type: 'option', label: 'Féminin' },
                    ],
                },
            ],
        },
        {
            name: 'ssc',
            type: 'group',
            label: 'Sites',
            children: [
                { name: 'SSC_pop', type: 'integer', label: 'Population' },
                { name: 'GPS_SSC', type: 'geopoint', label: 'Coordonnées' },
            ],
        },
    ],
};

const data = {
    date_collecte: '2025-06-23',
    nom_superviseur: 'ALIMETI NONDO',
    sexe_superviseur: 'm',
    SSC_pop: '324',
    GPS_SSC: '-0.168998 25.621456 433.2 1.5',
};

describe('getFieldKind', () => {
    it('maps question types onto display kinds', () => {
        expect(getFieldKind({ name: 'a', type: 'date' })).to.equal('date');
        expect(getFieldKind({ name: 'a', type: 'integer' })).to.equal('number');
        expect(getFieldKind({ name: 'a', type: 'select_one' })).to.equal(
            'choice',
        );
        expect(getFieldKind({ name: 'a', type: 'select multiple' })).to.equal(
            'multi',
        );
        expect(getFieldKind({ name: 'a', type: 'geopoint' })).to.equal('gps');
        // ODK metadata timestamps are dates too
        expect(getFieldKind({ name: 'a', type: 'start' })).to.equal('date');
        expect(getFieldKind({ name: 'a', type: 'end' })).to.equal('date');
        expect(getFieldKind({ name: 'a', type: 'image' })).to.equal('photo');
        expect(getFieldKind({ name: 'a', type: 'calculate' })).to.equal(
            'calculated',
        );
    });
    it('falls back to text for unknown types', () => {
        expect(getFieldKind({ name: 'a', type: 'barcode' })).to.equal('text');
    });
});

describe('buildSubmissionSections', () => {
    const sections = buildSubmissionSections(descriptor, data, 'fr');

    it('puts questions preceding any group in an unlabelled lead section', () => {
        expect(sections[0].id).to.equal(null);
        expect(sections[0].fields.map(f => f.id)).to.eql(['date_collecte']);
    });

    it('skips the meta group', () => {
        const ids = sections.flatMap(s => s.fields.map(f => f.id));
        expect(ids.includes('instanceID')).to.equal(false);
    });

    it('creates one section per group, in document order', () => {
        expect(sections.map(s => s.id)).to.eql([
            null,
            'superviseur_infos',
            'ssc',
        ]);
        expect(sections[1].label).to.equal('Informations sur le superviseur');
    });

    it('assigns each question to the section it belongs to', () => {
        expect(sections[1].fields.map(f => f.id)).to.eql([
            'nom_superviseur',
            'sexe_superviseur',
        ]);
        expect(sections[2].fields.map(f => f.id)).to.eql([
            'SSC_pop',
            'GPS_SSC',
        ]);
    });

    it('strips the ODK interpolation placeholder from metadata labels', () => {
        const withMeta = buildSubmissionSections(
            {
                name: 'survey',
                type: 'survey',
                children: [
                    {
                        name: 'start',
                        type: 'start',
                        label: 'Survey start time: ${start}',
                    },
                ],
            },
            { start: '2026-07-18T16:18:40.530+02:00' },
            'en',
        );
        expect(withMeta[0].fields[0].label).to.equal('Survey start time');
        expect(withMeta[0].fields[0].kind).to.equal('date');
    });

    it('resolves select_one values to their translated choice label', () => {
        const sexe = sections[1].fields[1];
        expect(sexe.kind).to.equal('choice');
        expect(sexe.value).to.equal('Masculin');
    });

    it('marks questions without an answer as empty', () => {
        const withoutAnswers = buildSubmissionSections(descriptor, {}, 'fr');
        expect(withoutAnswers[1].fields[0].empty).to.equal(true);
        expect(sections[1].fields[0].empty).to.equal(false);
    });
});

describe('filterSubmissionSections', () => {
    const sections = buildSubmissionSections(descriptor, data, 'fr');

    it('returns everything when the query is blank', () => {
        const result = filterSubmissionSections(sections, '   ');
        expect(result.sections.length).to.equal(3);
        expect(result.matchCount).to.equal(5);
    });

    it('matches on the question label, case insensitively', () => {
        const result = filterSubmissionSections(sections, 'POPULATION');
        expect(result.matchCount).to.equal(1);
        expect(result.sections.length).to.equal(1);
        expect(result.sections[0].id).to.equal('ssc');
    });

    it('matches on the question id too', () => {
        const result = filterSubmissionSections(sections, 'GPS_');
        expect(result.matchCount).to.equal(1);
        expect(result.sections[0].fields[0].id).to.equal('GPS_SSC');
    });

    it('keeps the original field count so headers can show "n of total"', () => {
        const result = filterSubmissionSections(sections, 'Population');
        expect(result.sections[0].fields.length).to.equal(1);
        expect(result.sections[0].totalFields).to.equal(2);
    });

    it('drops sections without any match', () => {
        const result = filterSubmissionSections(sections, 'superviseur');
        expect(result.sections.map(s => s.id)).to.eql(['superviseur_infos']);
    });

    it('returns no section when nothing matches', () => {
        const result = filterSubmissionSections(sections, 'zzzz');
        expect(result.sections).to.eql([]);
        expect(result.matchCount).to.equal(0);
    });
});
