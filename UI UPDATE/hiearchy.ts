src/mocks/hierarchy.ts


Implementation Tips for the UI

Debouncing: Don't run the search on every single pixel of movement. Wait about 150ms after the user stops typing to execute the filter. This prevents the UI from flickering.

Minimum Trigger: Set a minimum character limit (e.g., query.length > 1). Typing just "A" will return too many results; "A3" is specific enough to be useful.

Visual Highlight: Use ct-accent color (the cyan/green) to bold the matching text in the results list (e.g., "A3089").

Keyboard Navigation: Ensure users can use the Up/Down arrows and Enter to select a match without using their mouse.


/**
 * Mock data for the 4-level Device Explorer:
 * Brand -> ModelType -> Generation -> Variant
 */

export const MOCK_HIERARCHY = [
  {
    id: 1,
    name: "Apple",
    modelTypes: [
      {
        id: 101,
        name: "iPhone",
        generations: [
          {
            id: 1001,
            name: "iPhone 15",
            releaseYear: 2023,
            variants: [
              {
                id: 5001,
                modelNumber: "A3089",
                marketingName: "iPhone 15 Pro Max",
                wholesalePrice: 8900, // $89.00 in cents
                availableStock: 45,
                moq: 5,
                specifications: [
                  { label: "Capacity", value: "4441 mAh" },
                  { label: "Material", value: "Titanium" }
                ]
              },
              {
                id: 5002,
                modelNumber: "A2846",
                marketingName: "iPhone 15",
                wholesalePrice: 0, // Trigger: Show "Request Quote"
                availableStock: 0,
                moq: 10,
                specifications: [
                  { label: "Display", value: "Super Retina XDR" }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 2,
    name: "Samsung",
    modelTypes: [
      {
        id: 201,
        name: "Galaxy S",
        generations: [
          {
            id: 2001,
            name: "Galaxy S24",
            releaseYear: 2024,
            variants: [
              {
                id: 6001,
                modelNumber: "SM-S928B",
                marketingName: "Galaxy S24 Ultra",
                wholesalePrice: 9550,
                availableStock: 12, // Trigger: Show "Low Stock"
                moq: 2,
                specifications: [
                  { label: "Resolution", value: "3120 x 1440" }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
];
