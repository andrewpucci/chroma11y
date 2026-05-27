import {
  buildSideBySideNeutralAlignment,
  buildSideBySidePaletteAlignments
} from './comparisonRender';

export interface AlignedNeutralHex {
  currentHex: (string | null)[];
  referenceHex: (string | null)[];
}

export interface AlignedPaletteHex {
  currentHex: ((string | null)[] | null)[];
  referenceHex: ((string | null)[] | null)[];
}

export function deriveNeutralAlignment(
  currentHex: string[],
  referenceHex: string[]
): AlignedNeutralHex {
  const { alignmentMap } = buildSideBySideNeutralAlignment(currentHex, referenceHex);

  return {
    currentHex: alignmentMap.map((a) =>
      a.currentIndex !== null ? currentHex[a.currentIndex]! : null
    ),
    referenceHex: alignmentMap.map((a) =>
      a.referenceIndex !== null ? referenceHex[a.referenceIndex]! : null
    )
  };
}

export function derivePaletteAlignment(
  currentHex: string[][],
  referenceHex: string[][]
): AlignedPaletteHex {
  if (currentHex.length === 0 && referenceHex.length === 0) {
    return { currentHex: [], referenceHex: [] };
  }

  const pairs = buildSideBySidePaletteAlignments(currentHex, referenceHex);

  const alignedCurrentHex: ((string | null)[] | null)[] = [];
  const alignedReferenceHex: ((string | null)[] | null)[] = [];

  for (const pair of pairs) {
    if (pair.current.isPlaceholder) {
      alignedCurrentHex.push(null);
    } else {
      alignedCurrentHex.push(pair.current.swatches.map((s) => (s.isPlaceholder ? null : s.hex)));
    }

    if (pair.reference.isPlaceholder) {
      alignedReferenceHex.push(null);
    } else {
      alignedReferenceHex.push(
        pair.reference.swatches.map((s) => (s.isPlaceholder ? null : s.hex))
      );
    }
  }

  return { currentHex: alignedCurrentHex, referenceHex: alignedReferenceHex };
}
