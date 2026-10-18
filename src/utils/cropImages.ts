/**
 * Crop image utilities — extracted from FarmDetails.tsx so the page module
 * only default-exports a component (required by React Fast Refresh).
 */

const cropImages: Record<string, string> = {
    cotton: new URL('../assets/crops/cotton.png', import.meta.url).href,
    paddy: new URL('../assets/crops/paddy.png', import.meta.url).href,
    wheat: new URL('../assets/crops/wheat.png', import.meta.url).href,
    maize: new URL('../assets/crops/maize.png', import.meta.url).href,
    sugarcane: new URL('../assets/crops/wheat.png', import.meta.url).href,
    peanut: new URL('../assets/crops/Peanut.png', import.meta.url).href,
    soya: new URL('../assets/crops/soya.png', import.meta.url).href,
    tomato: new URL('../assets/crops/tomato.png', import.meta.url).href,
};

export const getCropImage = (cropName: string): string => {
    const key = cropName.toLowerCase();
    return cropImages[key] || cropImages['wheat'];
};
