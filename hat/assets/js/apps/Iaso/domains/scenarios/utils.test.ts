import { describe, expect, it } from 'vitest';
import { entityMainFields, fieldsToShow } from './utils';

describe('entityMainFields', () => {
    it('gathers the list, detail and duplicate search fields, once each', () => {
        expect(
            entityMainFields({
                fields_list_view: ['code_menage', 'nom_prenoms_enfant'],
                fields_detail_info_view: ['nom_prenoms_enfant'],
                fields_duplicate_search: ['qr_code'],
            }),
        ).toEqual(['code_menage', 'nom_prenoms_enfant', 'qr_code']);
        expect(entityMainFields(undefined)).toEqual([]);
    });
});

describe('fieldsToShow', () => {
    const before = {
        qr_code: 'CARD-0001',
        nom_prenoms_enfant: 'AMINA',
        cycle_1_rempli: '0',
        cycle_2_rempli: '0',
    };
    const after = { ...before, cycle_1_rempli: 'cycle_rempli' };
    const main = ['nom_prenoms_enfant', 'qr_code', 'not_in_the_profile'];

    it('shows the main fields the entity has, then the ones the step changed', () => {
        expect(fieldsToShow(before, after, main, false)).toEqual([
            'nom_prenoms_enfant',
            'qr_code',
            'cycle_1_rempli',
        ]);
    });

    it('shows the main fields only before the form is submitted', () => {
        expect(fieldsToShow(before, undefined, main, false)).toEqual([
            'nom_prenoms_enfant',
            'qr_code',
        ]);
    });

    it('shows every field on demand, or when there is no main field', () => {
        const all = [
            'qr_code',
            'nom_prenoms_enfant',
            'cycle_1_rempli',
            'cycle_2_rempli',
        ];
        expect(fieldsToShow(before, after, main, true)).toEqual(all);
        expect(fieldsToShow(before, after, [], false)).toEqual(all);
    });
});
