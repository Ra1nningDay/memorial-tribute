import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

/**
 * Exports tributes to an Excel file and downloads associated images in a ZIP archive.
 * @param {Array} tributes - Array of tribute objects from Supabase.
 * @param {Function} onProgress - Callback function to report progress (message).
 */
export const exportTributes = async (tributes, onProgress) => {
    try {
        onProgress('Preparing data...');
        const zip = new JSZip();
        const imgFolder = zip.folder('images');

        // 1. Prepare Data for Excel
        const excelRows = [];
        const imageDownloads = [];

        // Helper to handle image URL parsing
        const getImages = (tribute) => {
            const raw = tribute?.image_url;
            if (!raw) return [];
            if (Array.isArray(raw)) return raw.filter(Boolean);
            if (typeof raw === 'string') {
                try {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed)) return parsed.filter(Boolean);
                } catch (_) { }
                return [raw];
            }
            return [];
        };

        tributes.forEach((tribute, index) => {
            const images = getImages(tribute);
            const imageFilenames = [];

            images.forEach((url, imgIndex) => {
                // Create a safe filename: tributeID_index.ext or index_imgIndex.ext
                // We'll use a simple counter based approach to avoid long filenames
                const ext = url.split('.').pop().split('?')[0] || 'jpg';
                const filename = `image_${index + 1}_${imgIndex + 1}.${ext}`;
                imageFilenames.push(filename);

                imageDownloads.push({
                    url,
                    filename
                });
            });

            excelRows.push({
                ID: tribute.id,
                Name: tribute.name,
                Message: tribute.messages || tribute.message,
                Relationship: tribute.relationship,
                CreatedAt: tribute.created_at ? new Date(tribute.created_at).toLocaleString('th-TH') : '',
                Images: imageFilenames.join(', '), // Comma separated filenames in Excel
                OriginalImageURLs: images.join(', ')
            });
        });

        // 2. Generate Excel
        const worksheet = XLSX.utils.json_to_sheet(excelRows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Tributes');
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        zip.file('tributes.xlsx', excelBuffer);

        // 3. Download Images with Concurrency Limit
        const CONCURRENCY_LIMIT = 5;
        let completed = 0;
        const total = imageDownloads.length;

        onProgress(`Downloading images (0/${total})...`);

        // Simple concurrency queue
        const downloadImage = async (item) => {
            try {
                const response = await fetch(item.url);
                if (!response.ok) throw new Error(`Failed to fetch ${item.url}`);
                const blob = await response.blob();
                imgFolder.file(item.filename, blob);
            } catch (err) {
                console.warn(`Failed to download image: ${item.url}`, err);
                // Create a text file placeholder for failed images
                imgFolder.file(`${item.filename}.error.txt`, `Failed to download: ${item.url}\nError: ${err.message}`);
            } finally {
                completed++;
                onProgress(`Downloading images (${completed}/${total})...`);
            }
        };

        // Process in chunks
        for (let i = 0; i < imageDownloads.length; i += CONCURRENCY_LIMIT) {
            const chunk = imageDownloads.slice(i, i + CONCURRENCY_LIMIT);
            await Promise.all(chunk.map(downloadImage));
        }

        // 4. Generate Zip and Download
        onProgress('Compressing files...');
        const content = await zip.generateAsync({ type: 'blob' });
        saveAs(content, `tributes_archive_${new Date().toISOString().slice(0, 10)}.zip`);

        onProgress('Done!');
    } catch (error) {
        console.error('Export failed:', error);
        throw error;
    }
};
