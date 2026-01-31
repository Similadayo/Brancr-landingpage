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
    },

    // --- EDUCATION ---
    {
        id: 'edu_jamb_utme',
        name: 'Education: JAMB/UTME Registration',
        group: 'Education',
        description: 'Requirements for JAMB registration',
        requirements: [
            { label: 'NIN (National Identity Number)', description: 'Your 11-digit NIN', data_type: 'number' },
            { label: 'Profile Code', description: 'Your JAMB profile code', data_type: 'text' },
            { label: 'O-Level Results', description: 'Upload WAEC/NECO results (if available)', data_type: 'file' },
            { label: 'Preferred Exam Town', description: 'First and second choice exam towns', data_type: 'text' },
            { label: 'Choice of Institution', description: '1st Choice (Uni), 2nd (Poly), 3rd (College)', data_type: 'text' },
            { label: 'Course of Study', description: 'Preferred course', data_type: 'text' },
        ]
    },
    {
        id: 'edu_waec_neco',
        name: 'Education: WAEC/NECO Registration',
        group: 'Education',
        description: 'For SSCE external/internal registration',
        requirements: [
            { label: 'Passport Photograph', description: 'White background, recent photo', data_type: 'file' },
            { label: 'Date of Birth', description: 'As per birth certificate', data_type: 'date' },
            { label: 'Subjects to Register', description: 'List of subjects (min 8, max 9)', data_type: 'text' },
            { label: 'Exam Center Preference', description: 'Preferred state or area for the exam', data_type: 'text' },
        ]
    },
    {
        id: 'edu_school_app',
        name: 'Education: School Application (General)',
        group: 'Education',
        description: 'For Post-UTME or Admission support',
        requirements: [
            { label: 'JAMB Registration Number', description: 'Your JAMB Reg No.', data_type: 'text' },
            { label: 'JAMB Score', description: 'Your total JAMB score', data_type: 'number' },
            { label: 'O-Level Result', description: 'WAEC/NECO/NABTEB Result', data_type: 'file' },
            { label: 'A-Level / Diploma Result', description: 'For Direct Entry candidates', data_type: 'file' },
        ]
    },

    // --- DIGITAL MARKETING ---
    {
        id: 'marketing_onboarding',
        name: 'Marketing: Client Onboarding',
        group: 'Digital Marketing',
        description: 'Initial intake for marketing clients',
        requirements: [
            { label: 'Business Goals/Objectives', description: 'What are you trying to achieve?', data_type: 'text' },
            { label: 'Target Audience', description: 'Who is your ideal customer?', data_type: 'text' },
            { label: 'Competitors', description: 'Top 3 competitors in your niche', data_type: 'text' },
            { label: 'Brand Assets', description: 'Upload Logo, Fonts, Brand Guide', data_type: 'file' },
            { label: 'Social Media Handles', description: 'Links to your current social pages', data_type: 'text' },
        ]
    },
    {
        id: 'marketing_access',
        name: 'Marketing: Access & Technical',
        group: 'Digital Marketing',
        description: 'Credentials and access for campaigns',
        requirements: [
            { label: 'Website URL', description: 'Link to your website', data_type: 'url' },
            { label: 'Ad Account Access', description: 'Have you granted us admin access?', data_type: 'choice', options: JSON.stringify(['Yes', 'No', 'Need Help']) },
            { label: 'Google Analytics Access', description: 'Access to analytics property', data_type: 'choice', options: JSON.stringify(['Yes', 'No', 'Need Help']) },
        ]
    },

    // --- TRAVEL & TOURISM ---
    {
        id: 'travel_booking',
        name: 'Travel: Flight Booking',
        group: 'Travel Agency',
        description: 'Details for flight reservations',
        requirements: [
            { label: 'International Passport', description: 'Data page of your passport', data_type: 'file' },
            { label: 'Travel Dates', description: 'Departure and Return dates', data_type: 'text' },
            { label: 'Destination(s)', description: 'City/Country you are visiting', data_type: 'text' },
            { label: 'Class of Travel', description: 'Economy, Business, or First Class', data_type: 'choice', options: JSON.stringify(['Economy', 'Premium Economy', 'Business', 'First Class']) },
        ]
    },
    {
        id: 'travel_visa',
        name: 'Travel: Visa Application Support',
        group: 'Travel Agency',
        description: 'Docs for visa processing',
        requirements: [
            { label: 'Passport Photo', description: 'White background, 5x5cm or 2x2 inches', data_type: 'file' },
            { label: 'Bank Statement', description: 'Last 6 months statement (Proof of Funds)', data_type: 'file' },
            { label: 'Employment Letter / Introduction', description: 'Letter from employer', data_type: 'file' },
            { label: 'Travel History', description: 'List of countries visited in last 5 years', data_type: 'text' },
            { label: 'Purpose of Visit', description: 'Tourism, Business, Study, or Medical', data_type: 'text' },
        ]
    }
];
