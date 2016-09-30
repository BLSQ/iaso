/* global describe, it */
import assert from 'assert'
import {clone, deepEqual} from './index'

describe('clone', () => {
  it('should clone an obj', () => {
    const a = {foo: 11, bar: {baz: 22}}
    const b = clone(a)
    assert(a !== b)
    assert(b.foo === a.foo)
    assert(b.bar !== a.bar)
  })
})

describe('deepEqual', () => {
  it('should compare primitives', () => {
    let a = 1
    let b = 1
    assert(deepEqual(a, b), 'Primitives are equal')
    b = 2
    assert(!deepEqual(a, b), 'Primitives are not equal')
  })

  it('should compare objects', () => {
    let a = {foo: 11, bar: 22, baz: {y: 4}}
    let b = {bar: 22, foo: 11, baz: {y: 4}}
    assert(deepEqual(a, b), 'Objects are equal')
    b.baz.y = 5
    assert(!deepEqual(a, b), 'Objects are not equal')
  })

  it('should compare arrays', () => {
    let a = [1, 2, 3]
    let b = [1, 2, 3]
    assert(deepEqual(a, b), 'Arrays are equal')
    b = [1, 2, 2]
    assert(!deepEqual(a, b), 'Arrays are not equal')
  })

  it('should ignore null and undefined values', () => {
    let a = {x: 1, y: null, z: undefined}
    let b = {x: 1}
    assert(deepEqual(a, b, true), 'Should be equal without null values')
    assert(!deepEqual(a, b), 'Should not be equal with null values')
  })
})
