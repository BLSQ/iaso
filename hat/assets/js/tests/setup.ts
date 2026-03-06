import '@testing-library/jest-dom';

// fix for react-pdf
import DOMMatrix from "@thednp/dommatrix";
// @ts-ignore
global.DOMMatrix = DOMMatrix as unknown as typeof DOMMatrix