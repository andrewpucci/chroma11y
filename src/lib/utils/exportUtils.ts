export function downloadDesignTokens(neutrals: string[], palettes: string[][]): void {
	const tokens = {
		colors: {
			neutral: neutrals.map((color, index) => ({
				name: `neutral-${index}`,
				value: color
			})),
			palettes: palettes.map((palette, paletteIndex) => ({
				name: `palette-${paletteIndex + 1}`,
				colors: palette.map((color, colorIndex) => ({
					name: `color-${colorIndex}`,
					value: color
				}))
			}))
		}
	};
	
	downloadFile('design-tokens.json', JSON.stringify(tokens, null, 2));
}

export function downloadCSS(neutrals: string[], palettes: string[][]): void {
	let css = ':root {\n';
	
	// Neutral colors
	neutrals.forEach((color, index) => {
		css += `  --neutral-${index}: ${color};\n`;
	});
	
	// Palette colors
	palettes.forEach((palette, paletteIndex) => {
		palette.forEach((color, colorIndex) => {
			css += `  --palette-${paletteIndex + 1}-${colorIndex}: ${color};\n`;
		});
	});
	
	css += '}\n';
	
	downloadFile('colors.css', css);
}

export function downloadSCSS(neutrals: string[], palettes: string[][]): void {
	let scss = '$colors: (\n';
	
	// Neutral colors
	scss += '  neutral: (\n';
	neutrals.forEach((color, index) => {
		scss += `    ${index}: ${color},\n`;
	});
	scss += '  ),\n';
	
	// Palette colors
	scss += '  palettes: (\n';
	palettes.forEach((palette, paletteIndex) => {
		scss += `    ${paletteIndex + 1}: (\n`;
		palette.forEach((color, colorIndex) => {
			scss += `      ${colorIndex}: ${color},\n`;
		});
		scss += '    ),\n';
	});
	scss += '  ),\n';
	scss += ');\n';
	
	downloadFile('colors.scss', scss);
}

function downloadFile(filename: string, content: string): void {
	const blob = new Blob([content], { type: 'text/plain' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}
