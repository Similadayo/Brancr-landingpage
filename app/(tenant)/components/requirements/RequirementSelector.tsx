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
    const createCustomRequirement = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsApplyingTemplate(true);
        try {
            const formData = new FormData(e.target as HTMLFormElement);
            const newReqData = {
                label: formData.get('label'),
                data_type: formData.get('data_type'),
                description: formData.get('description'),
                is_required: true // Default to true as per plan
            };

            const res = await fetch('/api/tenant/requirements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(newReqData)
            });

            if (res.ok) {
                const newReq = await res.json();
                setRequirements(prev => [newReq, ...prev]);
                toggleReq(newReq.id); // Auto-select
                setIsCreating(false);
                toast.success("Requirement created");
            } else {
                toast.error("Failed to create");
            }
        } catch (err) {
            console.error(err);
            toast.error("Error creating requirement");
        } finally {
            setIsApplyingTemplate(false);
        }
    };

    const [isCreating, setIsCreating] = useState(false);

    // Prepare options for the Select component with pseudo-headers
    const templateOptions = useMemo(() => {
        const options: SelectOption[] = [];

        // Custom Create Option
        options.push({ label: "+ Create Custom Requirement", value: "create_new", description: "Define your own requirement field" });

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
            {!isCreating ? (
                <Select
                    options={templateOptions}
                    value=""
                    onChange={(val) => {
                        if (val === 'create_new') {
                            setIsCreating(true);
                        } else {
                            applyTemplate(val);
                        }
                    }}
                    placeholder={isApplyingTemplate ? "Applying..." : "Quick Apply: Select a template..."}
                    disabled={isApplyingTemplate}
                />
            ) : (
                <form onSubmit={createCustomRequirement} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Create Custom Requirement</h4>
                        <button
                            type="button"
                            onClick={() => setIsCreating(false)}
                            className="text-gray-400 hover:text-gray-500"
                        >
                            <XIcon className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Question / Label</label>
                            <input
                                name="label"
                                required
                                placeholder="e.g. What is your shoe size?"
                                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white py-2"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Data Type</label>
                                <select
                                    name="data_type"
                                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white py-2"
                                >
                                    <option value="text">Text Answer</option>
                                    <option value="number">Number</option>
                                    <option value="date">Date</option>
                                    <option value="file">File Upload</option>
                                    <option value="url">URL / Link</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description (Optional)</label>
                                <input
                                    name="description"
                                    placeholder="Help text for customer..."
                                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white py-2"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsCreating(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 transition-colors"
                            >
                                Create & Select
                            </button>
                        </div>
                    </div>
                </form>
            )}

            {selectedIds.length === 0 && !isCreating ? (
                <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center dark:border-gray-600">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 mb-3">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">No requirements yet</p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Select a template above or create a custom requirement.
                    </p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="border-b border-gray-100 bg-gray-50/50 px-4 py-3 dark:border-gray-700/50 dark:bg-gray-800/50">
                        <div className="flex items-center justify-between">
                            <h5 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Selected Requirements</h5>
                            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                {visibleRequirements.length} Active
                            </span>
                        </div>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {visibleRequirements.map((req) => (
                            <div
                                key={req.id}
                                className="group flex items-start gap-4 p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                            >
                                <div
                                    onClick={() => toggleReq(req.id)}
                                    className="mt-0.5 flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded border border-primary bg-primary text-white transition-opacity hover:opacity-90"
                                    title="Selected (Click to remove)"
                                >
                                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                            {req.label}
                                        </p>
                                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide
                                            ${req.data_type === 'file' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                                                req.data_type === 'date' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                                                    'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                                            {req.data_type}
                                        </span>
                                    </div>
                                    {req.description && (
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                                            {req.description}
                                        </p>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => toggleReq(req.id)}
                                    className="text-gray-400 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                                    title="Remove requirement"
                                >
                                    <XIcon className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
