'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tenantApi, Appointment } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { format, isToday, isTomorrow, isPast, isFuture, parseISO, compareAsc } from 'date-fns';
import {
    CalendarIcon,
    MagnifyingGlassIcon,
    ClockIcon,
    MapPinIcon,
    VideoCameraIcon,
    PhoneIcon,
    PlusIcon
} from '@/app/(tenant)/components/icons';
import { AppointmentModal } from '@/app/(tenant)/components/appointments/AppointmentModal';
// I'll stick to simple HTML/Tailwind dropdown or use a popover if complex. 
// Actually, I'll just use a simple state-based action menu for now to be safe.

export default function AppointmentsPage() {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'all'>('upcoming');
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

    // Fetch Appointments
    const { data: appointments, isLoading } = useQuery({
        queryKey: ['appointments'],
        queryFn: () => tenantApi.getAppointments(),
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: Omit<Appointment, 'id'>) => tenantApi.createAppointment(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
            toast.success('Appointment scheduled');
            setIsModalOpen(false);
        },
        onError: () => toast.error('Failed to schedule appointment')
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: Partial<Appointment> }) =>
            tenantApi.updateAppointment(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
            toast.success('Appointment updated');
            setIsModalOpen(false);
            setEditingAppointment(null);
        },
        onError: () => toast.error('Failed to update appointment')
    });

    const statusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string, status: string }) =>
            tenantApi.updateAppointmentStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
            toast.success('Status updated');
        },
        onError: () => toast.error('Failed to update status')
    });

    const cancelMutation = useMutation({
        mutationFn: (id: string) => tenantApi.cancelAppointment(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
            toast.success('Appointment cancelled');
        },
        onError: () => toast.error('Failed to cancel appointment')
    });

    const handleCreate = (data: Omit<Appointment, 'id'>) => {
        createMutation.mutate(data);
    };

    const handleUpdate = (data: Omit<Appointment, 'id'>) => {
        if (!editingAppointment) return;
        updateMutation.mutate({ id: editingAppointment.id, data });
    };

    const handleEdit = (appt: Appointment) => {
        setEditingAppointment(appt);
        setIsModalOpen(true);
    };

    const handleStatusChange = (id: string, status: string) => {
        statusMutation.mutate({ id, status });
    };

    const handleCancel = (id: string) => {
        if (confirm('Are you sure you want to cancel this appointment?')) {
            cancelMutation.mutate(id);
        }
    };

    // Filter and Sort
    const filteredAppointments = appointments?.filter(appt => {
        const matchesSearch =
            appt.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            appt.serviceType.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;

        const date = parseISO(appt.scheduledAt);
        if (activeTab === 'upcoming') return isFuture(date) || isToday(date);
        if (activeTab === 'past') return isPast(date) && !isToday(date);
        return true;
    }).sort((a, b) => compareAsc(parseISO(a.scheduledAt), parseISO(b.scheduledAt)));

    // Group by Date Section
    const groupedAppointments = filteredAppointments?.reduce((groups, appt) => {
        const date = parseISO(appt.scheduledAt);
        let key = 'Upcoming';
        if (isToday(date)) key = 'Today';
        else if (isTomorrow(date)) key = 'Tomorrow';
        else if (isPast(date)) key = 'Past';
        else key = format(date, 'MMMM do, yyyy'); // detailed future dates

        if (!groups[key]) groups[key] = [];
        groups[key].push(appt);
        return groups;
    }, {} as Record<string, Appointment[]>);

    // Custom sort order for keys logic would happen here if strict section ordering needed (Today -> Tomorrow -> Future)
    // For simplicity, we iterate the object keys or reconstructed map in render.

    const renderAppointmentCard = (appt: Appointment) => (
        <div key={appt.id} className="bg-white dark:bg-dark-surface p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
                {/* Date Box */}
                <div className="flex-shrink-0 w-16 text-center bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2">
                    <div className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">
                        {format(parseISO(appt.scheduledAt), 'MMM')}
                    </div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                        {format(parseISO(appt.scheduledAt), 'dd')}
                    </div>
                </div>

                {/* Details */}
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{appt.serviceType}</h3>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize
              ${appt.status === 'confirmed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                                appt.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                                    appt.status === 'completed' ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' :
                                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                            }`}>
                            {appt.status}
                        </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                            Attempting to use simple unicode for user icon 👤 {appt.customerName}
                        </span>
                        <span className="flex items-center gap-1">
                            <ClockIcon className="w-4 h-4" />
                            {format(parseISO(appt.scheduledAt), 'h:mm a')} ({appt.duration}m)
                        </span>
                        <span className="flex items-center gap-1">
                            {appt.meetingType === 'online' ? <VideoCameraIcon className="w-4 h-4" /> :
                                appt.meetingType === 'phone' ? <PhoneIcon className="w-4 h-4" /> :
                                    <MapPinIcon className="w-4 h-4" />}
                            <span className="capitalize">{appt.meetingType.replace('_', ' ')}</span>
                        </span>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 self-end md:self-center">
                {appt.meetingType === 'online' && appt.meetingLink && (
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(appt.meetingLink!);
                            toast.success('Link copied');
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700"
                    >
                        Copy Link
                    </button>
                )}

                {appt.status !== 'cancelled' && (
                    <>
                        <button
                            onClick={() => handleEdit(appt)}
                            className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg dark:text-blue-400 dark:bg-blue-900/20 dark:hover:bg-blue-900/30"
                        >
                            Reschedule
                        </button>
                        <button
                            onClick={() => handleCancel(appt.id)}
                            className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg dark:text-red-400 dark:bg-red-900/20 dark:hover:bg-red-900/30"
                        >
                            Cancel
                        </button>
                    </>
                )}
            </div>
        </div>
    );

    const sectionOrder = ['Today', 'Tomorrow', 'Upcoming', 'Past'];
    // Merge dynamic sections
    const dynamicSections = Object.keys(groupedAppointments || {}).filter(k => !sectionOrder.includes(k));
    const displaySections = [...sectionOrder.filter(k => groupedAppointments?.[k]), ...dynamicSections.sort()];

    return (
        <div className="flex h-[calc(100vh-4rem)] bg-gray-50 dark:bg-black overflow-hidden flex-col">
            {/* Header */}
            <header className="px-8 py-6 bg-white dark:bg-dark-surface border-b border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <CalendarIcon className="w-6 h-6 text-primary" />
                        Appointments
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage your schedule and upcoming meetings.</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search appointments..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>

                    <button
                        onClick={() => {
                            setEditingAppointment(null);
                            setIsModalOpen(true);
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-sm whitespace-nowrap"
                    >
                        <PlusIcon className="w-4 h-4" />
                        Schedule
                    </button>
                </div>
            </header>

            {/* Tabs */}
            <div className="px-8 pt-4 pb-0 bg-white dark:bg-dark-surface border-b border-gray-200 dark:border-gray-800 flex gap-6">
                {['upcoming', 'past', 'all'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`pb-4 text-sm font-medium border-b-2 transition-colors capitalize ${activeTab === tab
                            ? 'border-primary text-primary'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                    >
                        {tab === 'all' ? 'All Appointments' : `${tab} Appointments`}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8">
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : filteredAppointments?.length === 0 ? (
                    <div className="text-center py-20">
                        <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No appointments found</h3>
                        <p className="text-gray-500 text-sm">Schedule a new appointment to get started.</p>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto space-y-8">
                        {displaySections.map(section => (
                            <div key={section}>
                                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                                    {section}
                                </h3>
                                <div className="space-y-4">
                                    {groupedAppointments?.[section]?.map(renderAppointmentCard)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <AppointmentModal
                appointment={editingAppointment}
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingAppointment(null);
                }}
                onSubmit={editingAppointment ? handleUpdate : handleCreate}
                isSubmitting={createMutation.isPending || updateMutation.isPending}
            />
        </div>
    );
}
