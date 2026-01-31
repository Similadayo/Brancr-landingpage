import { useState, useEffect, useMemo } from 'react';
import { LoadingState } from '../ui/LoadingState';
import { REQUIREMENT_TEMPLATES, RequirementTemplate } from './RequirementTemplates';
import { toast } from 'react-hot-toast';
import Select, { SelectOption } from '../ui/Select';
import { XIcon } from '../icons';

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

    // Prepare options for the Select component with pseudo-headers
    const templateOptions = useMemo(() => {
        const options: SelectOption[] = [];
        const groups = Array.from(new Set(REQUIREMENT_TEMPLATES.map(t => t.group)));

        groups.forEach(group => {
            // Header
            options.push({ label: group.toUpperCase(), value: `header_${group}`, disabled: true });
            // Items
            REQUIREMENT_TEMPLATES.filter(t => t.group === group).forEach(t => {
                options.push({
                    label: t.name,
                    value: t.id,
                    description: t.description
                });
            });
        });
        return options;
    }, []);

    const visibleRequirements = requirements.filter(req => selectedIds.includes(req.id));

    if (isLoading) return <LoadingState />;

    return (
        <div className="space-y-4">
            {/* Template Selector */}
            <Select
                options={templateOptions}
                value=""
                onChange={(val) => applyTemplate(val)}
                placeholder={isApplyingTemplate ? "Applying..." : "Quick Apply: Select a template..."}
                disabled={isApplyingTemplate}
            />

            {selectedIds.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 p-4 text-center text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
                    No requirements selected. Use "Quick Apply" above to add some.
                </div>
            ) : (
                <div className="space-y-2">
                    {visibleRequirements.map((req) => {
                        return (
                            <div
                                key={req.id}
                                className="group flex items-start gap-3 rounded-lg border border-primary bg-primary/5 p-3 transition-all dark:bg-primary/10"
                            >
                                <div
                                    onClick={() => toggleReq(req.id)}
                                    className="mt-0.5 flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded border border-primary bg-primary text-white hover:opacity-80"
                                    title="Click to remove"
                                >
                                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-medium text-primary">
                                        {req.label}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                                        {req.description || 'No description'} • <span className="uppercase text-[10px] tracking-wider font-semibold opacity-70 bg-white/50 dark:bg-gray-700 px-1.5 py-0.5 rounded">{req.data_type}</span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => toggleReq(req.id)}
                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                    title="Remove requirement"
                                >
                                    <XIcon className="h-4 w-4" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
