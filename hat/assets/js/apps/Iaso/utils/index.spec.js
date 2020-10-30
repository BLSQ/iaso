import assert from 'assert';
import { clone, deepEqual, substituteVars } from './index';

describe('clone', () => {
    it('should clone an obj', () => {
        const a = { foo: 11, bar: { baz: 22 } };
        const b = clone(a);
        assert(a !== b);
        assert(b.foo === a.foo);
        assert(b.bar !== a.bar);
    });
});

describe('deepEqual', () => {
    it('should compare primitives', () => {
        const a = 1;
        let b = 1;
        assert(deepEqual(a, b), 'Primitives are equal');
        b = 2;
        assert(!deepEqual(a, b), 'Primitives are not equal');
    });

    it('should compare objects', () => {
        const a = { foo: 11, bar: 22, baz: { y: 4 } };
        const b = { bar: 22, foo: 11, baz: { y: 4 } };
        assert(deepEqual(a, b), 'Objects are equal');
        b.baz.y = 5;
        assert(!deepEqual(a, b), 'Objects are not equal');
    });

    it('should compare arrays', () => {
        const a = [1, 2, 3];
        let b = [1, 2, 3];
        assert(deepEqual(a, b), 'Arrays are equal');
        b = [1, 2, 2];
        assert(!deepEqual(a, b), 'Arrays are not equal');
    });

    it('should ignore null and undefined values', () => {
        const a = { x: 1, y: null, z: undefined };
        const b = { x: 1 };
        assert(deepEqual(a, b, true), 'Should be equal without null values');
        assert(!deepEqual(a, b), 'Should not be equal with null values');
    });
});

describe('substituteVars', () => {
    it('should substitute values in an object', () => {
        const templateObj = {
            foo: 11,
            bar: '${a}', // eslint-disable-line
            baz: {
                x: '${y}', // eslint-disable-line
            },
        };
        const subs = {
            a: 22,
            y: 'hello',
        };
        const expectedObj = {
            foo: 11,
            bar: 22,
            baz: {
                x: 'hello',
            },
        };
        const newObj = substituteVars(templateObj, subs);
        assert.deepEqual(newObj, expectedObj);
        assert(newObj !== templateObj);
    });
});
