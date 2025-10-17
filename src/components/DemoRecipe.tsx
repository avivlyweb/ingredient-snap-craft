// Demo recipe data showcasing nutritional intelligence
export const demoRecipe = {
  title: "Mediterranean Quinoa Power Bowl with Herb-Crusted Salmon",
  description: "A nutrient-dense, anti-inflammatory powerhouse combining omega-3 rich salmon with protein-packed quinoa, antioxidant-rich vegetables, and heart-healthy Mediterranean flavors. This meal delivers sustained energy while supporting cardiovascular health and muscle recovery.",
  ingredients: [
    "200g wild-caught salmon fillet",
    "1 cup quinoa (uncooked)",
    "2 cups baby spinach",
    "1 cup cherry tomatoes, halved",
    "1 medium avocado, sliced",
    "¼ cup extra virgin olive oil",
    "2 cloves garlic, minced",
    "1 lemon (juice and zest)",
    "Fresh herbs (parsley, dill, basil)",
    "¼ cup pumpkin seeds",
    "Sea salt and black pepper to taste"
  ],
  steps: `Step 1: Rinse quinoa and cook in vegetable broth (instead of water) to boost mineral content. This preserves more nutrients than boiling and adds extra flavor compounds.

Step 2: While quinoa cooks, prepare the salmon. Create an herb crust by mixing minced garlic, fresh herbs, lemon zest, and a drizzle of olive oil. This herb coating protects the omega-3 fatty acids during cooking.

Step 3: Bake salmon at 375°F (190°C) for 12-15 minutes until just cooked through. Avoid overcooking to preserve heat-sensitive omega-3s and B vitamins.

Step 4: Steam spinach for 2-3 minutes (instead of sautéing) to retain maximum vitamin C and folate content while reducing oxalates.

Step 5: Assemble the bowl: fluffy quinoa base, steamed spinach, fresh tomatoes (uncooked to preserve vitamin C), sliced avocado for healthy fats that enhance nutrient absorption.

Step 6: Top with herb-crusted salmon and sprinkle with pumpkin seeds for added zinc and magnesium.

Step 7: Drizzle with extra virgin olive oil and fresh lemon juice. The vitamin C in lemon enhances iron absorption from the spinach and quinoa!`,
  cuisine_style: "Mediterranean Fusion",
  serving_suggestion: "Serve immediately while salmon is warm and vegetables are crisp. Pair with a light white wine or sparkling water with lemon for optimal digestion.",
  context_type: "athletic_performance",
  plating_guidance: "Create visual appeal with color contrast: arrange vibrant green spinach, ruby-red tomatoes, and golden quinoa in distinct sections. Place the herb-crusted salmon as the centerpiece. Garnish with fresh herb sprigs and a lemon wedge.",
  time_management: "Total time: 35 minutes (15 min prep, 20 min cooking). Cook quinoa and salmon simultaneously to save time. Prep vegetables while proteins cook.",
  ambiance_suggestions: "This energizing meal pairs perfectly with bright, natural lighting. Play upbeat music to match the vibrant, health-focused energy of the dish.",
  leftover_tips: "Salmon and quinoa stay fresh for 3-4 days refrigerated. Store separately from fresh vegetables. Cold salmon and quinoa make an excellent next-day salad - the flavors intensify overnight!",
  image_url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
  nutrition: {
    calories: 680,
    protein: 42,
    carbs: 52,
    fat: 32,
    fiber: 12
  },
  health_insights: [
    {
      title: "Omega-3 Powerhouse for Recovery",
      description: "Wild salmon provides 2,000mg of EPA/DHA omega-3s per serving, reducing inflammation and accelerating muscle recovery after intense workouts.",
      type: "benefit" as const
    },
    {
      title: "Complete Protein Synergy",
      description: "Quinoa (8g) + Salmon (34g) = 42g high-quality protein with all essential amino acids for optimal muscle protein synthesis.",
      type: "benefit" as const
    },
    {
      title: "Iron Absorption Maximized",
      description: "Vitamin C from lemon and tomatoes increases iron absorption from spinach and quinoa by up to 300%, preventing fatigue.",
      type: "synergy" as const
    },
    {
      title: "Healthy Fats Enhance Nutrients",
      description: "Avocado and olive oil help absorb fat-soluble vitamins A, D, E, K from vegetables - up to 15x better absorption!",
      type: "synergy" as const
    },
    {
      title: "Pre-Workout Timing Tip",
      description: "Eat this meal 2-3 hours before training for sustained energy, or within 30 minutes post-workout for optimal recovery.",
      type: "tip" as const
    },
    {
      title: "Magnesium for Performance",
      description: "Pumpkin seeds and spinach provide 150mg magnesium - crucial for energy production, muscle function, and reducing cramps.",
      type: "benefit" as const
    }
  ]
};

export const demoIngredients = [
  "Salmon fillet",
  "Quinoa",
  "Baby spinach", 
  "Cherry tomatoes",
  "Avocado",
  "Olive oil",
  "Garlic",
  "Lemon",
  "Fresh herbs",
  "Pumpkin seeds"
];

export const demoIngredientImages = [
  "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=400&q=80"
];
