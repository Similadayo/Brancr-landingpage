export interface RequirementHelper {
    label: string;
    description: string;
    data_type: 'text' | 'number' | 'date' | 'file' | 'choice' | 'url';
    options?: string; // JSON string for choice
}

export interface RequirementTemplate {
    id: string;
    name: string;
    group: string; // For UI grouping (e.g., "Industry: Fashion", "Add-on: Logistics")
    description: string;
    requirements: RequirementHelper[];
}

export const REQUIREMENT_TEMPLATES: RequirementTemplate[] = [
    // --- FASHION & RETAIL ---
    {
        id: 'fashion_measurements',
        name: 'Fashion: Custom Measurements',
        group: 'Fashion & Retail',
        description: 'Collect body measurements for custom tailoring',
        requirements: [
            { label: 'Bust Size (inches)', description: 'Measure around the fullest part of your bust', data_type: 'number' },
            { label: 'Waist Size (inches)', description: 'Measure around your natural waistline', data_type: 'number' },
            { label: 'Hip Size (inches)', description: 'Measure around the fullest part of your hips', data_type: 'number' },
            { label: 'Height (ft/cm)', description: 'Your full height', data_type: 'text' },
        ]
    },
    {
        id: 'fashion_choices',
        name: 'Fashion: Size & Color Choices',
        group: 'Fashion & Retail',
        description: 'Standard size and color selection',
        requirements: [
            { label: 'Size', description: 'Select your preferred size', data_type: 'choice', options: JSON.stringify(['XS', 'S', 'M', 'L', 'XL', 'XXL']) },
            { label: 'Color Preference', description: 'Preferred color for this item', data_type: 'text' },
        ]
    },

    // --- FOOD & BEVERAGE ---
    {
        id: 'food_preferences',
        name: 'Food: Preferences & Allergies',
        group: 'Food & Beverage',
        description: 'Crucial info for food orders',
        requirements: [
            { label: 'Allergies / Dietary Restrictions', description: 'e.g. Nut allergy, Vegan, Gluten-free', data_type: 'text' },
            { label: 'Spice Level', description: 'How spicy would you like it?', data_type: 'choice', options: JSON.stringify(['Mild', 'Medium', 'Hot', 'Extra Hot']) },
            { label: 'Cutlery Needed?', description: 'Do you need disposable cutlery?', data_type: 'choice', options: JSON.stringify(['Yes', 'No']) },
        ]
    },
    {
        id: 'cake_custom',
        name: 'Food: Custom Cake/Pastry',
        group: 'Food & Beverage',
        description: 'Details for custom bakery orders',
        requirements: [
            { label: 'Message on Cake', description: 'Text to write on the cake', data_type: 'text' },
            { label: 'Flavor Preference', description: 'Preferred cake flavor/filling', data_type: 'text' },
            { label: 'Theme / Colors', description: 'Describe the theme or colors', data_type: 'text' },
        ]
    },

    // --- SERVICES ---
    {
        id: 'service_consultation',
        name: 'Services: Consultation Prep',
        group: 'Professional Services',
        description: 'Pre-meeting intake form',
        requirements: [
            { label: 'Meeting Topic', description: 'What do you want to discuss?', data_type: 'text' },
            { label: 'Preferred Date/Time', description: 'When are you available?', data_type: 'text' },
            { label: 'Meeting Platform', description: 'Preferred way to meet', data_type: 'choice', options: JSON.stringify(['Zoom', 'Google Meet', 'Phone Call', 'In-Person']) },
        ]
    },
    {
        id: 'service_design',
        name: 'Services: Design Brief',
        group: 'Professional Services',
        description: 'Brief for creative services',
        requirements: [
            { label: 'Brand Name', description: 'Name of the brand/project', data_type: 'text' },
            { label: 'Brand Colors', description: 'Preferred colors (Hex codes or names)', data_type: 'text' },
            { label: 'Design Inspiration', description: 'Links to designs you like', data_type: 'text' },
            { label: 'Logo/Assets', description: 'Upload existing logo or assets', data_type: 'file' },
        ]
    },

    // --- LOGISTICS & ADD-ONS (Universal) ---
    {
        id: 'delivery_essentials',
        name: 'Add-on: Delivery Essentials',
        group: 'Logistics & General',
        description: 'Standard delivery info (Combine with Retail/Food)',
        requirements: [
            { label: 'Delivery Address', description: 'Full street address including landmark', data_type: 'text' },
            { label: 'Recipient Name', description: 'Name of the person receiving the item', data_type: 'text' },
            { label: 'Recipient Phone', description: 'Active phone number for delivery driver', data_type: 'text' },
            { label: 'Special Delivery Instructions', description: 'Gate code, leave at door, etc.', data_type: 'text' },
        ]
    },
    {
        id: 'kyc_basic',
        name: 'Add-on: KYC / Identity',
        group: 'Logistics & General',
        description: 'Identity verification requirements',
        requirements: [
            { label: 'Government ID', description: 'Upload a valid ID card', data_type: 'file' },
            { label: 'Date of Birth', description: 'Your date of birth', data_type: 'date' },
        ]
    },
    {
        id: 'event_booking',
        name: 'Add-on: Event Details',
        group: 'Logistics & General',
        description: 'For venue or event services',
        requirements: [
            { label: 'Event Date', description: 'Date of the event', data_type: 'date' },
            { label: 'Event Venue', description: 'Address of the venue', data_type: 'text' },
            { label: 'Guest Count', description: 'Estimated number of guests', data_type: 'number' },
        ]
    }
];
