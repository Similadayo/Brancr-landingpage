export interface RequirementHelper {
    label: string;
    description: string;
    data_type: 'text' | 'number' | 'date' | 'file' | 'choice' | 'url';
    options?: string; // JSON string for choice
}

export interface RequirementTemplate {
    id: string;
    name: string;
    description: string;
    requirements: RequirementHelper[];
}

export const REQUIREMENT_TEMPLATES: RequirementTemplate[] = [
    {
        id: 'delivery_physical',
        name: 'Physical Delivery',
        description: 'Standard requirements for shipping physical goods',
        requirements: [
            {
                label: 'Delivery Address',
                description: 'Full street address including city and state',
                data_type: 'text'
            },
            {
                label: 'Contact Phone Number',
                description: 'Phone number for the delivery driver to contact',
                data_type: 'text'
            },
            {
                label: 'Delivery Instructions',
                description: 'Gate codes, landmarks, or special drop-off instructions',
                data_type: 'text'
            }
        ]
    },
    {
        id: 'kyc_basic',
        name: 'Basic ID Verification',
        description: 'Collect ID documents for verification',
        requirements: [
            {
                label: 'Government ID',
                description: 'Upload a clear photo of your Valid ID (Passport, NIN, Drivers License)',
                data_type: 'file'
            },
            {
                label: 'Date of Birth',
                description: 'Select your date of birth as it appears on your ID',
                data_type: 'date'
            }
        ]
    },
    {
        id: 'graphic_design',
        name: 'Design Brief',
        description: 'Standard questions for creative design projects',
        requirements: [
            {
                label: 'Brand Name',
                description: 'The exact name to appear in the design',
                data_type: 'text'
            },
            {
                label: 'Brand Colors',
                description: 'Preferred hex codes or color names',
                data_type: 'text'
            },
            {
                label: 'Inspiration / References',
                description: 'Links to designs you like',
                data_type: 'text'
            },
            {
                label: 'Upload Logo/Assets',
                description: 'Any existing assets we should use',
                data_type: 'file'
            }
        ]
    },
    {
        id: 'consultation',
        name: 'Consultation Prep',
        description: 'Pre-meeting information collection',
        requirements: [
            {
                label: 'Meeting Topic',
                description: 'Main topic or specific questions you want to discuss',
                data_type: 'text'
            },
            {
                label: 'Preferred Platform',
                description: 'Zoom, Google Meet, or Pone Call?',
                data_type: 'choice',
                options: JSON.stringify(['Google Meet', 'Zoom', 'Phone Call', 'WhatsApp Audio'])
            }
        ]
    }
];
