/**
 * Optimizes Cloudinary image URLs by adding transformation parameters.
 * @param {string} url - The original image URL.
 * @param {number} width - The desired width of the image.
 * @returns {string} The optimized image URL.
 */
export const getOptimizedImageUrl = (url, width = 800) => {
    if (!url) return '';
    if (!url.includes('cloudinary.com')) return url;

    // Split the URL at 'upload/' to inject transformations
    const parts = url.split('/upload/');
    if (parts.length < 2) return url;

    // f_auto: automatically choose best format (webp/avif)
    // q_auto: automatically adjust quality
    // w_{width}: resize to specific width
    // c_limit: ensure image doesn't scale up if original is smaller
    const transformation = `f_auto,q_auto,w_${width},c_limit`;

    return `${parts[0]}/upload/${transformation}/${parts[1]}`;
};
