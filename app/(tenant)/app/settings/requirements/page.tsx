'use client';

import { RequirementsList } from '../../../components/requirements/RequirementsList';

export default function RequirementsPage() {
    return (
        <div className="flex h-screen flex-col bg-gray-50 dark:bg-dark-bg">
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                <div className="mx-auto max-w-5xl">
                    <RequirementsList />
                </div>
            </div>
        </div>
    );
}
