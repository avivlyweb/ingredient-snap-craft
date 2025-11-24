// Portion size conversions to grams
// Based on USDA and NEVO standard portions

interface PortionConversion {
  unit: string;
  grams: number;
  aliases?: string[];
}

const portionConversions: Record<string, PortionConversion[]> = {
  // Volume measurements
  cup: [
    { unit: 'cup', grams: 240, aliases: ['cups', 'c'] },
    { unit: 'tablespoon', grams: 15, aliases: ['tbsp', 'tablespoons', 'tbs'] },
    { unit: 'teaspoon', grams: 5, aliases: ['tsp', 'teaspoons'] },
  ],
  
  // Common food portions
  vegetables: [
    { unit: 'small tomato', grams: 90 },
    { unit: 'medium tomato', grams: 120 },
    { unit: 'large tomato', grams: 180 },
    { unit: 'small onion', grams: 70 },
    { unit: 'medium onion', grams: 110 },
    { unit: 'large onion', grams: 150 },
    { unit: 'small carrot', grams: 50 },
    { unit: 'medium carrot', grams: 60 },
    { unit: 'large carrot', grams: 72 },
    { unit: 'small potato', grams: 170 },
    { unit: 'medium potato', grams: 213 },
    { unit: 'large potato', grams: 299 },
  ],
  
  proteins: [
    { unit: 'chicken breast', grams: 174, aliases: ['chicken breast half', 'breast'] },
    { unit: 'egg', grams: 50, aliases: ['large egg', 'whole egg'] },
    { unit: 'salmon fillet', grams: 140, aliases: ['fish fillet'] },
  ],
  
  // Grains
  grains: [
    { unit: 'cup cooked rice', grams: 158 },
    { unit: 'cup uncooked rice', grams: 185 },
    { unit: 'cup cooked pasta', grams: 140 },
    { unit: 'cup uncooked pasta', grams: 90 },
    { unit: 'slice bread', grams: 25, aliases: ['bread slice'] },
  ],
};

export const parsePortionToGrams = (portionText: string): number | null => {
  const lowerText = portionText.toLowerCase().trim();
  
  // Try to extract number from text (e.g., "2 cups" → 2)
  const numberMatch = lowerText.match(/^(\d+(?:\.\d+)?)\s*/);
  const quantity = numberMatch ? parseFloat(numberMatch[1]) : 1;
  
  // Remove the number from text to get just the unit
  const unitText = lowerText.replace(/^\d+(?:\.\d+)?\s*/, '');
  
  // Search through all conversion categories
  for (const category of Object.values(portionConversions)) {
    for (const conversion of category) {
      const matchTerms = [conversion.unit, ...(conversion.aliases || [])];
      
      for (const term of matchTerms) {
        if (unitText.includes(term)) {
          return conversion.grams * quantity;
        }
      }
    }
  }
  
  return null;
};

export const formatPortionWithGrams = (portionText: string): string => {
  const grams = parsePortionToGrams(portionText);
  
  if (grams) {
    return `${portionText} (${Math.round(grams)}g)`;
  }
  
  return portionText;
};

// Convert common portions to standard weights for NEVO lookups
export const normalizeIngredientPortion = (
  ingredientText: string
): { name: string; gramsPerServing: number } => {
  const grams = parsePortionToGrams(ingredientText);
  
  if (grams) {
    // Extract just the ingredient name (remove quantities and units)
    const name = ingredientText
      .replace(/^\d+(?:\.\d+)?\s*/, '') // Remove leading numbers
      .replace(/(cup|tbsp|tsp|small|medium|large|slice|whole|half|cooked|uncooked)/gi, '') // Remove portion words
      .trim();
    
    return { name, gramsPerServing: grams };
  }
  
  // Default to 100g if no portion detected
  return { name: ingredientText, gramsPerServing: 100 };
};
