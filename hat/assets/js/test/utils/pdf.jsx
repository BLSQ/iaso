// test/setup.js or in your test file
const mock = require('mock-require');

// Mock pdfjs-dist
mock('pdfjs-dist', {
    GlobalWorkerOptions: {
        workerSrc: '',
    },
    getDocument: () => ({
        promise: Promise.resolve({
            numPages: 1,
            getPage: () => ({
                promise: Promise.resolve({
                    getTextContent: () => ({
                        promise: Promise.resolve({ items: [] }),
                    }),
                }),
            }),
        }),
    }),
});

// Mock react-pdf
mock('react-pdf', {
    Document: ({ children }) => <div>{children}</div>,
    Page: () => <div>Page</div>,
    pdfjs: {
        GlobalWorkerOptions: {
            workerSrc: '',
        },
    },
});
