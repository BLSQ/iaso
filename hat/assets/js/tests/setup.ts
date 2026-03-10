import '@testing-library/jest-dom';

// fix for react-pdf
import DOMMatrix from '@thednp/dommatrix';
import { vi } from 'vitest';
// @ts-ignore
global.DOMMatrix = DOMMatrix as unknown as typeof DOMMatrix;

// Mock the ResizeObserver
const ResizeObserverMock = vi.fn(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

// Stub the global ResizeObserver
vi.stubGlobal('ResizeObserver', ResizeObserverMock);
