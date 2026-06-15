import '@testing-library/jest-dom';
import DOMMatrix from '@thednp/dommatrix';
import { toHaveNoViolations } from 'jest-axe';

// fix for react-pdf
import { vi } from 'vitest';
// @ts-ignore
global.DOMMatrix = DOMMatrix as unknown as typeof DOMMatrix;

// Mock the ResizeObserver
const observe = vi.fn();
const unobserve = vi.fn();
const disconnect = vi.fn();

class ResizeObserverMock {
    observe = observe;
    unobserve = unobserve;
    disconnect = disconnect;
}

// Stub the global ResizeObserver
vi.stubGlobal('ResizeObserver', ResizeObserverMock);

expect.extend(toHaveNoViolations);
