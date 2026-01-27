import { formatColor, getPaletteName } from "./colorUtils.js";

export const exportColors = (neutrals, palettes) => {
    const exportedData = {
        color: {
            name: "color",
            _base: {
                gray: {},
                blue: {},
                purple: {},
                orchid: {},
                pink: {},
                red: {},
                orange: {},
                gold: {},
                lime: {},
                green: {},
                turquoise: {},
                skyblue: {},
            },
        }
    };

    neutrals.forEach((color, index) => {
        const step = index * 10;
        exportedData.color._base.gray[step] = {
            name: `_base/gray/${step}`,
            description: "",
            value: formatColor(color),
            type: "color"
        };
    });

    palettes.forEach((palette, paletteIndex) => {
        // const paletteName = getPaletteName(palette); //`palette-${paletteIndex + 1}`;
        // exportedData.color._base[paletteName] = {};

        const paletteName = Object.keys(exportedData.color._base)[paletteIndex + 1];

        palette.forEach((color, index) => {
            const step = index * 10;
            exportedData.color._base[paletteName][step] = {
                name: `_base/${paletteName}/${step}`,
                description: "",
                value: formatColor(color),
                type: "color"
            };
        });
    });

    return exportedData;
};
