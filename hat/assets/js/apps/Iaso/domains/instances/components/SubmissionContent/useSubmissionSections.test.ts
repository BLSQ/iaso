import { Descriptor } from '../InstanceFileContentRich';
import { SubmissionSection } from './types';
import {
    buildSubmissionTree,
    filterSubmissionTree,
    getFieldKind,
    getSectionFields,
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

const fieldIds = (section: SubmissionSection): string[] =>
    getSectionFields(section).map(field => field.id);

const childSections = (section: SubmissionSection): SubmissionSection[] =>
    section.items.flatMap(item =>
        item.type === 'section' ? [item.section] : [],
    );

describe('buildSubmissionTree', () => {
    const tree = buildSubmissionTree(descriptor, data, 'fr');
    const [superviseur, ssc] = childSections(tree);

    it('keeps top level questions on the headerless root section', () => {
        expect(tree.id).to.equal(null);
        expect(tree.label).to.equal(null);
        expect(fieldIds(tree)).to.eql(['date_collecte']);
    });

    it('skips the meta group', () => {
        expect(childSections(tree).map(section => section.id)).to.eql([
            'superviseur_infos',
            'ssc',
        ]);
    });

    it('nests one section per group under its parent, in document order', () => {
        expect(superviseur.label).to.equal('Informations sur le superviseur');
        expect(superviseur.key).to.equal('/superviseur_infos');
        expect(fieldIds(superviseur)).to.eql([
            'nom_superviseur',
            'sexe_superviseur',
        ]);
        expect(fieldIds(ssc)).to.eql(['SSC_pop', 'GPS_SSC']);
    });

    it('keeps a question following a sub group on its own group', () => {
        const nested = buildSubmissionTree(
            {
                name: 'survey',
                type: 'survey',
                children: [
                    {
                        name: 'outer',
                        type: 'group',
                        label: 'Outer',
                        children: [
                            { name: 'before', type: 'text' },
                            {
                                name: 'inner',
                                type: 'group',
                                label: 'Inner',
                                children: [{ name: 'inside', type: 'text' }],
                            },
                            { name: 'after', type: 'text' },
                        ],
                    },
                ],
            },
            {},
            'en',
        );
        const [outer] = childSections(nested);
        expect(outer.items.map(item => item.type)).to.eql([
            'field',
            'section',
            'field',
        ]);
        expect(fieldIds(outer)).to.eql(['before', 'after']);
        const [inner] = childSections(outer);
        expect(inner.depth).to.equal(1);
        expect(fieldIds(inner)).to.eql(['inside']);
    });

    it('strips the ODK interpolation placeholder from metadata labels', () => {
        const withMeta = buildSubmissionTree(
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
        const [start] = getSectionFields(withMeta);
        expect(start.label).to.equal('Survey start time');
        expect(start.kind).to.equal('date');
    });

    it('resolves select_one values to their translated choice label', () => {
        const sexe = getSectionFields(superviseur)[1];
        expect(sexe.kind).to.equal('choice');
        expect(sexe.value).to.equal('Masculin');
    });

    it('marks questions without an answer as empty', () => {
        const [emptySuperviseur] = childSections(
            buildSubmissionTree(descriptor, {}, 'fr'),
        );
        expect(getSectionFields(emptySuperviseur)[0].empty).to.equal(true);
        expect(getSectionFields(superviseur)[0].empty).to.equal(false);
    });
});

describe('filterSubmissionTree', () => {
    const tree = buildSubmissionTree(descriptor, data, 'fr');

    it('returns the whole tree when the query is blank', () => {
        const result = filterSubmissionTree(tree, '   ');
        expect(result.tree).to.equal(tree);
        expect(result.matchCount).to.equal(5);
    });

    it('matches on the question label, case insensitively', () => {
        const result = filterSubmissionTree(tree, 'POPULATION');
        expect(result.matchCount).to.equal(1);
        const sections = childSections(result.tree!);
        expect(sections.map(section => section.id)).to.eql(['ssc']);
    });

    it('matches on the question id too', () => {
        const result = filterSubmissionTree(tree, 'GPS_');
        expect(result.matchCount).to.equal(1);
        expect(fieldIds(childSections(result.tree!)[0])).to.eql(['GPS_SSC']);
    });

    it('keeps the original field count so headers can show "n of total"', () => {
        const result = filterSubmissionTree(tree, 'Population');
        const [ssc] = childSections(result.tree!);
        expect(getSectionFields(ssc)).to.have.length(1);
        expect(ssc.totalFields).to.equal(2);
    });

    it('drops sections without any match below them', () => {
        const result = filterSubmissionTree(tree, 'superviseur');
        expect(fieldIds(result.tree!)).to.eql([]);
        expect(childSections(result.tree!).map(section => section.id)).to.eql([
            'superviseur_infos',
        ]);
    });

    it('returns no tree when nothing matches', () => {
        const result = filterSubmissionTree(tree, 'zzzz');
        expect(result.tree).to.equal(undefined);
        expect(result.matchCount).to.equal(0);
    });
});

describe('buildSubmissionTree with repeats', () => {
    const repeatDescriptor: Descriptor = {
        name: 'survey',
        type: 'survey',
        children: [
            {
                name: 'members',
                type: 'repeat',
                label: 'Household member',
                children: [
                    { name: 'member_name', type: 'text', label: 'Name' },
                ],
            },
        ],
    };

    it('nests one labelled section per iteration under a parent holding the count', () => {
        const tree = buildSubmissionTree(
            repeatDescriptor,
            { members: [{ member_name: 'Ada' }, { member_name: 'Bob' }] },
            'en',
        );
        const [repeat] = childSections(tree);
        expect(repeat.label).to.equal('Household member');
        expect(repeat.repeatCount).to.equal(2);
        const iterations = childSections(repeat);
        expect(
            iterations.map(({ key, label, depth }) => ({ key, label, depth })),
        ).to.eql([
            { key: '/members[0]', label: 'Household member (1)', depth: 1 },
            { key: '/members[1]', label: 'Household member (2)', depth: 1 },
        ]);
        expect(getSectionFields(iterations[0])[0].value).to.equal('Ada');
    });

    it('keeps the parent section with a zero count when the repeat has no iteration', () => {
        const [repeat] = childSections(
            buildSubmissionTree(repeatDescriptor, {}, 'en'),
        );
        expect(repeat.repeatCount).to.equal(0);
        expect(repeat.items).to.eql([]);
    });

    it('keeps the repeat and iteration headers above a matching question while searching', () => {
        const tree = buildSubmissionTree(
            repeatDescriptor,
            { members: [{ member_name: 'Ada' }] },
            'en',
        );
        const { tree: filtered } = filterSubmissionTree(tree, 'name');
        const [repeat] = childSections(filtered!);
        expect(repeat.id).to.equal('members');
        expect(childSections(repeat)[0].label).to.equal('Household member (1)');
    });
});
