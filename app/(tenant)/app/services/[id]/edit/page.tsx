'use client';

import Link from "next/link";
import { useServices } from "../../../../hooks/useServices";
import ServiceForm from "../../../../components/services/ServiceForm";

export default function EditServicePage({ params }: { params: { id: string } }) {
  const serviceId = parseInt(params.id, 10);
  
  const { data: services = [], isLoading } = useServices();
  const service = services.find((s) => s.id === serviceId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="rounded-xl border-2 border-rose-200 bg-rose-50 p-8 text-center">
        <p className="text-sm font-semibold text-rose-900">Service not found</p>
        <Link href="/app/services" className="mt-4 inline-block text-sm text-primary hover:underline">
          Back to Services
        </Link>
      </div>
    );
  }

  return <ServiceForm service={service} />;
}
