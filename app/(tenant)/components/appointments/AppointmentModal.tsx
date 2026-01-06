'use client';

import { useState, useEffect } from 'react';
import { Modal, ModalTitle, ModalBody, ModalFooter } from '../ui/Modal';
import { Appointment } from '@/lib/api';

interface AppointmentModalProps {
    appointment?: Appointment | null;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Omit<Appointment, 'id'>) => void;
    isSubmitting: boolean;
}

export function AppointmentModal({ appointment, isOpen, onClose, onSubmit, isSubmitting }: AppointmentModalProps) {
    const [form, setForm] = useState<Partial<Omit<Appointment, 'id'>>>({
        customerName: '',
        serviceType: '',
        status: 'scheduled',
        scheduledAt: '',
        duration: 30,
        meetingType: 'online',
        meetingLink: '',
        location: '',
        customerNotes: '',
    });

    useEffect(() => {
        if (appointment) {
            setForm({
                customerName: appointment.customerName,
                serviceType: appointment.serviceType,
                status: appointment.status,
                scheduledAt: appointment.scheduledAt.slice(0, 16), // Format for datetime-local
                duration: appointment.duration,
                meetingType: appointment.meetingType,
                meetingLink: appointment.meetingLink,
                location: appointment.location,
                customerNotes: appointment.customerNotes,
            });
        } else {
            setForm({
                customerName: '',
                serviceType: '',
                status: 'scheduled',
                scheduledAt: new Date().toISOString().slice(0, 16),
                duration: 30,
                meetingType: 'online',
                meetingLink: '',
                location: '',
                customerNotes: '',
            });
        }
    }, [appointment, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.customerName || !form.scheduledAt) return;

        onSubmit({
            customerName: form.customerName!,
            serviceType: form.serviceType || 'General Consultation',
            status: form.status as any || 'scheduled',
            scheduledAt: new Date(form.scheduledAt!).toISOString(),
            duration: form.duration || 30,
            meetingType: form.meetingType as any || 'online',
            meetingLink: form.meetingLink,
            location: form.location,
            customerNotes: form.customerNotes,
        });
    };

    return (
        <Modal open={isOpen} onClose={onClose} size="md">
            <form onSubmit={handleSubmit}>
                <ModalTitle className="px-6 pt-6 mb-4">
                    {appointment ? 'Edit Appointment' : 'Schedule Appointment'}
                </ModalTitle>

                <ModalBody className="space-y-4 px-6 pb-4">
                    {/* Customer Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Customer Name</label>
                        <input
                            type="text"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                            value={form.customerName}
                            onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                        />
                    </div>

                    {/* Service Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Service Type</label>
                        <input
                            type="text"
                            placeholder="e.g. Discovery Call"
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                            value={form.serviceType}
                            onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
                        />
                    </div>

                    {/* Date & Duration Row */}
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date & Time</label>
                            <input
                                type="datetime-local"
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                                value={form.scheduledAt}
                                onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                            />
                        </div>
                        <div className="w-1/3">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Duration (min)</label>
                            <input
                                type="number"
                                min="15"
                                step="15"
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                                value={form.duration}
                                onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) })}
                            />
                        </div>
                    </div>

                    {/* Meeting Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Meeting Type</label>
                        <div className="flex gap-4 mt-2">
                            {[
                                { value: 'online', label: 'Online' },
                                { value: 'in_person', label: 'In-person' },
                                { value: 'phone', label: 'Phone' }
                            ].map(type => (
                                <label key={type.value} className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="meetingType"
                                        value={type.value}
                                        checked={form.meetingType === type.value}
                                        onChange={(e) => setForm({ ...form, meetingType: e.target.value as any })}
                                        className="text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm dark:text-gray-300">{type.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Conditional Location/Link */}
                    {form.meetingType === 'online' ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Meeting Link</label>
                            <input
                                type="url"
                                placeholder="https://zoom.us/..."
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                                value={form.meetingLink}
                                onChange={(e) => setForm({ ...form, meetingLink: e.target.value })}
                            />
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                {form.meetingType === 'phone' ? 'Phone Number' : 'Location Address'}
                            </label>
                            <input
                                type="text"
                                placeholder={form.meetingType === 'phone' ? '+234...' : '123 Main St...'}
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                                value={form.location}
                                onChange={(e) => setForm({ ...form, location: e.target.value })}
                            />
                        </div>
                    )}

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes (Internal)</label>
                        <textarea
                            rows={3}
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                            value={form.customerNotes}
                            onChange={(e) => setForm({ ...form, customerNotes: e.target.value })}
                        />
                    </div>

                </ModalBody>

                <ModalFooter className="flex justify-end gap-3 px-6 pb-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-md shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
                    >
                        {isSubmitting ? 'Saving...' : 'Save Appointment'}
                    </button>
                </ModalFooter>
            </form>
        </Modal>
    );
}
