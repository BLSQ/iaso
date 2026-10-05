import { orgUnitTilesUrl } from './orgUnitTiles';

describe('orgUnitTilesUrl', () => {
    it('builds an absolute tile url template with the filters as query params', () => {
        expect(
            orgUnitTilesUrl(
                { parent_id: 12, fields: 'name,validation_status' },
                'https://iaso.test',
            ),
        ).toBe(
            'https://iaso.test/api/v3/orgunits/tiles/{z}/{x}/{y}/?parent_id=12&fields=name,validation_status',
        );
    });

    it('drops undefined filters', () => {
        expect(
            orgUnitTilesUrl({ version_id: undefined }, 'https://iaso.test'),
        ).toBe('https://iaso.test/api/v3/orgunits/tiles/{z}/{x}/{y}/');
    });
});
