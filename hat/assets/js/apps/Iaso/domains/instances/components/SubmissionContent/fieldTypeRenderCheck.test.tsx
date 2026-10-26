import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { formatFieldDate } from '../../utils/formatDate';
import { Descriptor } from '../InstanceFileContentRich';
import { SubmissionContent } from './SubmissionContent';

vi.mock('Iaso/components/maps/MarkerMapComponent', () => ({
    MarkerMap: () => <div data-testid="marker-map" />,
}));

vi.mock('Iaso/components/files/DocumentsItemComponent', () => ({
    default: ({ filePath }: { filePath: string }) => (
        <a href={filePath}>document</a>
    ),
}));

vi.mock('Iaso/components/files/VideoItemComponent', () => ({
    default: ({ videoPath }: { videoPath: string }) => (
        <video src={videoPath} aria-label="video" />
    ),
}));

const choice = (name: string, label: string): Descriptor =>
    ({ name, type: 'option', label }) as Descriptor;

const colors = [
    choice('red', 'Red'),
    choice('green', 'Green'),
    choice('blue', 'Blue'),
];

const question = (
    name: string,
    type: Descriptor['type'],
    label: string,
    children?: Descriptor[],
): Descriptor => ({ name, type, label, children });

/**
 * Descriptor and answers for testdata/field_type_render_check, the same
 * submission the backend chain test imports from a mobile zip.
 */
const formDescriptor: Descriptor = {
    name: 'field_type_render_check',
    type: 'survey',
    children: [
        question('q_note_intro', 'note', 'Read me'),
        question('g_scalars', 'group', 'Scalars', [
            question('q_integer', 'integer', 'Integer'),
            question('q_decimal', 'decimal', 'Decimal'),
            question('q_range', 'range', 'Range'),
            question('q_text', 'text', 'Text'),
            question('q_barcode', 'barcode', 'Barcode'),
            question('q_date', 'date', 'Date'),
            question('q_time', 'time', 'Time'),
            question('q_datetime', 'dateTime', 'Date time'),
            question('q_geopoint', 'geopoint', 'Geopoint'),
            question('q_geotrace', 'geotrace', 'Geotrace'),
            question('q_geoshape', 'geoshape', 'Geoshape'),
            question('q_start', 'start', 'Start'),
            question('q_end', 'end', 'End'),
            question('q_acknowledge', 'acknowledge', 'Acknowledge'),
        ]),
        question('g_selects', 'group', 'Selects', [
            question(
                'q_select_one_underscore',
                'select one',
                'Select one',
                colors,
            ),
            question(
                'q_select_one_space',
                'select one',
                'Select one spaced',
                colors,
            ),
            question(
                'q_select_multiple_underscore',
                'select all that apply',
                'Select multiple',
                colors,
            ),
            question(
                'q_select_all_that_apply',
                'select all that apply',
                'Select all',
                colors,
            ),
            question('q_rank', 'rank', 'Rank', colors),
        ]),
        question('g_media', 'group', 'Media', [
            question('q_image', 'photo', 'Image'),
            question('q_photo', 'photo', 'Photo'),
            question('q_audio', 'audio', 'Audio'),
            question('q_video', 'video', 'Video'),
            question('q_file', 'file', 'File'),
        ]),
        question('g_special', 'group', 'Special', [
            question('q_calculate', 'calculate', 'Calculate'),
            question('deviceid', 'deviceid', 'Device id'),
            question('subscriberid', 'subscriberid', 'Subscriber id'),
            question('simserial', 'simserial', 'SIM serial'),
            question('phonenumber', 'phonenumber', 'Phone number'),
            question('q_note_inside_group', 'note', 'Note inside'),
        ]),
        question('household_count', 'calculate', 'Household count'),
        question('household', 'repeat', 'Household', [
            question('member_name', 'text', 'Member name'),
            question('member_age', 'integer', 'Member age'),
        ]),
        question('q_note_unsupported', 'note', 'Unsupported types'),
    ],
};

const instanceData = {
    q_integer: '42',
    q_decimal: '3.5',
    q_range: '4',
    q_text: 'hello render',
    q_barcode: 'ABC-123',
    q_date: '2026-10-23',
    q_time: '08:30:00',
    q_datetime: '2026-10-23T08:30:00.000',
    q_geopoint: '50.8503 4.3517 0 0',
    q_geotrace: '50.85 4.35 0 0; 50.86 4.36 0 0',
    q_geoshape: '50.85 4.35 0 0; 50.86 4.36 0 0; 50.85 4.35 0 0',
    q_start: '2026-10-23T13:59:00.000+02:00',
    q_end: '2026-10-23T14:13:00.000+02:00',
    q_acknowledge: 'OK',
    q_select_one_underscore: 'red',
    q_select_one_space: 'green',
    q_select_multiple_underscore: 'red blue',
    q_select_all_that_apply: 'red green',
    q_rank: 'red green blue',
    q_image: 'facility.png',
    q_photo: 'facility.png',
    q_audio: 'voice.mp3',
    q_video: 'clip.mp4',
    q_file: 'report.pdf',
    q_calculate: '45.5',
    deviceid: '354450115013285',
    subscriberid: '608015139845644',
    simserial: '8922101051398456440',
    phonenumber: '+32470123456',
    household_count: '2',
    household: [
        { member_name: 'Ada', member_age: '7' },
        { member_name: 'Grace', member_age: '8' },
    ],
};

const files = [
    '/media/facility.png',
    '/media/voice.mp3',
    '/media/clip.mp4',
    '/media/report.pdf',
];

describe('field type render check submission', () => {
    it('renders every answer from the mobile submission through the field rows', async () => {
        const user = userEvent.setup();
        renderWithThemeAndIntlProvider(
            <SubmissionContent
                formDescriptor={formDescriptor}
                instanceData={instanceData}
                files={files}
            />,
        );

        expect(screen.getByText('Integer')).toBeInTheDocument();
        expect(screen.getByText('42')).toBeInTheDocument();
        expect(screen.getByText('3.5')).toBeInTheDocument();
        expect(screen.getByText('hello render')).toBeInTheDocument();
        expect(screen.getByTitle('hello render')).toBeInTheDocument();
        expect(screen.getByText('ABC-123')).toBeInTheDocument();
        expect(screen.getByText('08:30:00')).toBeInTheDocument();
        expect(
            screen.getByText(formatFieldDate('2026-10-23')),
        ).toBeInTheDocument();
        expect(
            screen.getByText(formatFieldDate('2026-10-23T08:30:00.000')),
        ).toBeInTheDocument();
        expect(
            screen.getByText(formatFieldDate('2026-10-23T13:59:00.000+02:00')),
        ).toBeInTheDocument();
        expect(
            screen.getByText(formatFieldDate('2026-10-23T14:13:00.000+02:00')),
        ).toBeInTheDocument();
        expect(screen.getByText('OK')).toBeInTheDocument();
        expect(screen.getAllByText('Red').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Green').length).toBeGreaterThan(0);
        expect(screen.getByText('Blue')).toBeInTheDocument();
        expect(screen.getByText('red green blue')).toBeInTheDocument();
        expect(screen.getAllByTestId('marker-map')).toHaveLength(3);
        expect(screen.getByRole('img', { name: 'q_image' })).toHaveAttribute(
            'src',
            '/media/facility.png',
        );
        expect(screen.getByRole('img', { name: 'q_photo' })).toHaveAttribute(
            'src',
            '/media/facility.png',
        );
        expect(screen.getByLabelText('video')).toHaveAttribute(
            'src',
            '/media/clip.mp4',
        );
        const documents = screen.getAllByRole('link', { name: 'document' });
        expect(documents.map(link => link.getAttribute('href'))).toEqual(
            expect.arrayContaining(['/media/voice.mp3', '/media/report.pdf']),
        );
        expect(screen.getByText('45.5')).toBeInTheDocument();
        expect(screen.getByText('354450115013285')).toBeInTheDocument();
        expect(screen.getByText('608015139845644')).toBeInTheDocument();
        expect(screen.getByText('8922101051398456440')).toBeInTheDocument();
        expect(screen.getByText('+32470123456')).toBeInTheDocument();
        expect(screen.getByText('Read me')).toBeInTheDocument();
        expect(screen.getByText('Note inside')).toBeInTheDocument();
        expect(screen.getByText('Unsupported types')).toBeInTheDocument();
        expect(screen.getByText(/2 entries/)).toBeInTheDocument();

        await user.click(
            screen.getByRole('button', { name: /Household \(1\)/ }),
        );
        await user.click(
            screen.getByRole('button', { name: /Household \(2\)/ }),
        );

        expect(screen.getByText('Ada')).toBeInTheDocument();
        expect(screen.getByText('7')).toBeInTheDocument();
        expect(screen.getByText('Grace')).toBeInTheDocument();
        expect(screen.getByText('8')).toBeInTheDocument();
    });
});
