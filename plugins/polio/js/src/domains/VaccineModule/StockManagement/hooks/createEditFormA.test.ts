import { patchRequest2, postRequest2 } from '../../SupplyChain/hooks/api/vrf';
import { createEditFormA } from './api';

vi.mock('../../SupplyChain/hooks/api/vrf', () => ({
    patchRequest2: vi.fn().mockResolvedValue({ id: 1 }),
    postRequest2: vi.fn().mockResolvedValue({ id: 2 }),
}));

const mockedPatch = vi.mocked(patchRequest2);
const mockedPost = vi.mocked(postRequest2);

beforeEach(() => {
    vi.clearAllMocks();
});

describe('createEditFormA', () => {
    describe('payload filtering', () => {
        it('drops undefined values from payload', async () => {
            await createEditFormA({
                status: 'received',
                campaign: undefined,
                vaccine_stock: 'vs-1',
            });

            const { data } = mockedPost.mock.calls[0][0] as any;
            expect(data).not.toHaveProperty('campaign');
            expect(data).toHaveProperty('status', 'received');
            expect(data).toHaveProperty('vaccine_stock', 'vs-1');
        });

        it('preserves null values in payload (intentional clears)', async () => {
            await createEditFormA({
                status: 'received',
                form_a_reception_date: null,
                vaccine_stock: 'vs-1',
            });

            const { data } = mockedPost.mock.calls[0][0] as any;
            expect(data).toHaveProperty('form_a_reception_date', null);
        });

        it('excludes file key from JSON payload regardless of value', async () => {
            await createEditFormA({
                status: 'received',
                vaccine_stock: 'vs-1',
                file: 'https://example.com/doc.pdf',
            });

            const { data } = mockedPost.mock.calls[0][0] as any;
            expect(data).not.toHaveProperty('file');
        });
    });

    describe('create vs PATCH routing', () => {
        it('sends POST when body has no id', async () => {
            await createEditFormA({
                status: 'received',
                vaccine_stock: 'vs-1',
            });

            expect(mockedPost).toHaveBeenCalledOnce();
            expect(mockedPatch).not.toHaveBeenCalled();
            expect((mockedPost.mock.calls[0][0] as any).url).toBe(
                '/api/polio/vaccine/stock/outgoing_stock_movement/',
            );
        });

        it('sends PATCH to /id/ URL when body has id', async () => {
            await createEditFormA({
                id: 42,
                status: 'received',
                vaccine_stock: 'vs-1',
            });

            expect(mockedPatch).toHaveBeenCalledOnce();
            expect(mockedPost).not.toHaveBeenCalled();
            expect((mockedPatch.mock.calls[0][0] as any).url).toBe(
                '/api/polio/vaccine/stock/outgoing_stock_movement/42/',
            );
        });
    });

    describe('file upload guard (isNewFileUpload)', () => {
        it('does NOT trigger multipart when file is a server-returned URL string', async () => {
            await createEditFormA({
                status: 'received',
                vaccine_stock: 'vs-1',
                file: 'https://example.com/doc.pdf',
            });

            const arg = mockedPost.mock.calls[0][0] as any;
            expect(arg).not.toHaveProperty('fileData');
        });

        it('triggers multipart when file is an array containing File instances', async () => {
            const fakeFile = new File(['content'], 'doc.pdf', {
                type: 'application/pdf',
            });

            await createEditFormA({
                status: 'received',
                vaccine_stock: 'vs-1',
                file: [fakeFile],
            });

            const arg = mockedPost.mock.calls[0][0] as any;
            expect(arg).toHaveProperty('fileData');
            expect(arg.fileData.files).toEqual([fakeFile]);
            // JSON data should not have `file` key
            expect(arg.data).not.toHaveProperty('file');
        });

        it('does NOT trigger multipart when file is undefined', async () => {
            await createEditFormA({
                status: 'received',
                vaccine_stock: 'vs-1',
                file: undefined,
            });

            const arg = mockedPost.mock.calls[0][0] as any;
            expect(arg).not.toHaveProperty('fileData');
        });

        it('does NOT trigger multipart when file is an empty array', async () => {
            await createEditFormA({
                status: 'received',
                vaccine_stock: 'vs-1',
                file: [],
            });

            const arg = mockedPost.mock.calls[0][0] as any;
            expect(arg).not.toHaveProperty('fileData');
        });
    });

    describe('lot numbers', () => {
        it('converts comma-separated lot_numbers string to array', async () => {
            await createEditFormA({
                status: 'received',
                vaccine_stock: 'vs-1',
                lot_numbers: '111,222,333',
            });

            const { data } = mockedPost.mock.calls[0][0] as any;
            expect(data.lot_numbers).toEqual(['111', '222', '333']);
        });

        it('leaves lot_numbers alone when already an array', async () => {
            await createEditFormA({
                status: 'received',
                vaccine_stock: 'vs-1',
                lot_numbers: ['111', '222'],
            });

            const { data } = mockedPost.mock.calls[0][0] as any;
            expect(data.lot_numbers).toEqual(['111', '222']);
        });
    });
});
