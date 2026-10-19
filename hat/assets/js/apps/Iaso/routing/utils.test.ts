import { getRawSplat } from './utils';

describe('getRawSplat', () => {
    it('returns the encoded part of the pathname matched by "*"', () => {
        expect(
            getRawSplat(
                '/entities/list/accountId/1/search/01211%2Fsh%2F20%2F0008e/page/1',
                'entities/list/*',
            ),
        ).toBe('accountId/1/search/01211%2Fsh%2F20%2F0008e/page/1');
    });

    it('accepts route paths with a leading slash', () => {
        expect(
            getRawSplat('/polio/im/ihh/campaign/a%2Fb', '/polio/im/ihh/*'),
        ).toBe('campaign/a%2Fb');
    });

    it('returns an empty string when nothing is matched by "*"', () => {
        expect(getRawSplat('/entities/list', 'entities/list/*')).toBe('');
        expect(getRawSplat('/error401', 'error401')).toBe('');
    });
});
