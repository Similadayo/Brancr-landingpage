'use client';

import React from 'react';
import BulkUploadWizard from '@/app/(tenant)/components/posting/BulkUploadWizard';
import { Toaster } from 'react-hot-toast';

export default function BulkUploadPage() {
    return (
        <div className="min-h-screen bg-gray-50/50">
            <div className="bg-white border-b border-gray-200 px-4 py-4 md:px-8">
                <h1 className="text-xl font-bold text-gray-900">Bulk Scheduler</h1>
                <p className="text-sm text-gray-500">Upload multiple photos/videos and schedule them in batches</p>
            </div>
            <div className="p-4">
                <BulkUploadWizard />
            </div>
            <Toaster position="bottom-right" />
        </div>
    );
}
