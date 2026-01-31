import { useState, useEffect } from 'react';
import { LoadingState } from '../ui/LoadingState';
import { REQUIREMENT_TEMPLATES, RequirementTemplate } from './RequirementTemplates';
import { toast } from 'react-hot-toast';

interface Requirement {
    id: string;
    label: string;
    description: string;
    data_type: string;
}

interface RequirementSelectorProps {
    selectedIds: string[];
    onChange: (ids: string[]) => void;
}

export function RequirementSelector({ selectedIds, onChange }: RequirementSelectorProps) {
    const [requirements, setRequirements] = useState<Requirement[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isApplyingTemplate, setIsApplyingTemplate] = useState(false);

    async function fetchReqs() {
        try {
            const res = await fetch('/api/tenant/requirements', { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setRequirements(data.requirements || []);
            }
        } catch (e) {
            console.error('Failed to load requirements', e);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        fetchReqs();
    }, []);

    const toggleReq = (id: string) => {
        if (selectedIds.includes(id)) {
            onChange(selectedIds.filter((sid) => sid !== id));
        } else {
            onChange([...selectedIds, id]);
        }
    };

    /**
     * applyTemplate:
     * 1. Iterates over reqs in the chosen template.
     * 2. Checks if a matching requirement (label + datatype) exists.
     * 3. If yes, uses its ID.
     * 4. If no, creates it via API and uses the new ID.
     * 5. Updates selection.
     */
    const applyTemplate = async (templateId: string) => {
        if (!templateId) return;
        const template = REQUIREMENT_TEMPLATES.find(t => t.id === templateId);
        if (!template) return;

        setIsApplyingTemplate(true);
        const newSelectedIds = new Set(selectedIds);
        let createdCount = 0;

        try {
            // We need the latest list to check against
            // (although 'requirements' state should be reasonably up to date)

            for (const reqDef of template.requirements) {
                // Find existing match
                let match = requirements.find(r =>
                    r.label.toLowerCase() === reqDef.label.toLowerCase() &&
                    r.data_type === reqDef.data_type
                );

                if (match) {
                    newSelectedIds.add(match.id);
                } else {
                    // Create it
                    const res = await fetch('/api/tenant/requirements', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify(reqDef)
                    });

                    if (res.ok) {
                        const newReq = await res.json();
                        newSelectedIds.add(newReq.id);
                        createdCount++;
                        // Optimistically add to local list so next iteration finds it if needed
                        setRequirements(prev => [newReq, ...prev]);
                    }
                }
            }

            onChange(Array.from(newSelectedIds));
            toast.success(`Applied "${template.name}" template`);

            // If we created new ones, refresh fully to be safe
            if (createdCount > 0) {
                fetchReqs();
            }

        } catch (error) {
            console.error(error);
            toast.error("Failed to apply template fully");
        } finally {
            setIsApplyingTemplate(false);
        }
    };

    if (isLoading) return <LoadingState />;

    return (
        <div className="space-y-4">
            {/* Template Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-gray-50 p-3 rounded-lg dark:bg-gray-800/50">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    Quick Apply:
                </div>
                <select
                    className="flex-1 rounded-md border-gray-300 py-1.5 text-sm shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    onChange={(e) => {
                        applyTemplate(e.target.value);
                        e.target.value = ""; // Reset selector
                    }}
                    disabled={isApplyingTemplate}
                    defaultValue=""
                >
                    <option value="" disabled>Select a template...</option>

                    {/* Unique Groups */}
                    {Array.from(new Set(REQUIREMENT_TEMPLATES.map(t => t.group))).map(group => (
                        <optgroup key={group} label={group}>
                            {REQUIREMENT_TEMPLATES.filter(t => t.group === group).map(t => (
                                <option key={t.id} value={t.id}>
                                    {t.name}
                                </option>
                            ))}
                        </optgroup>
                    ))}
                </select>
                {isApplyingTemplate && <span className="text-xs text-primary animate-pulse">Applying...</span>}
            </div>

            {requirements.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 p-4 text-center text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
                    No requirements defined yet. Use a template above or create one in Settings.
                </div>
            ) : (
                <div className="space-y-2">
                    {requirements.map((req) => {
                        const isSelected = selectedIds.includes(req.id);
                        return (
                            <div
                                key={req.id}
                                onClick={() => toggleReq(req.id)}
                                className={`group flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-all ${isSelected
                                    ? 'border-primary bg-primary/5 dark:bg-primary/10'
                                    : 'border-gray-200 bg-white hover:border-primary/30 hover:shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:hover:border-primary/30'
                                    }`}
                            >
                                <div
                                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${isSelected
                                        ? 'border-primary bg-primary text-white'
                                        : 'border-gray-300 bg-white group-hover:border-primary/50 dark:border-gray-600 dark:bg-gray-800'
                                        }`}
                                >
                                    {isSelected && (
                                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-gray-900 dark:text-white'}`}>
                                        {req.label}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                                        {req.description || 'No description'} • <span className="uppercase text-[10px] tracking-wider font-semibold opacity-70 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{req.data_type}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
