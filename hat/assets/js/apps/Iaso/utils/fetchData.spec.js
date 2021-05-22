import assert from 'assert';
import { createUrl } from './fetchData';

describe('createUrl', () => {
    it('should create an url', () => {
        const url = createUrl({
            foo: 11,
            bar: 12,
            baz: 'hello',
        });
        assert(url === '/charts/foo/11/bar/12/baz/hello');
    });
});
