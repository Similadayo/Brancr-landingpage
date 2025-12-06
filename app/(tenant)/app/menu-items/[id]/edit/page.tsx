'use client';

import { use } from "react";
import Link from "next/link";
import { useMenuItems } from "../../../../hooks/useMenuItems";
import MenuItemForm from "../../../../components/menu-items/MenuItemForm";

export default function EditMenuItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const menuItemId = parseInt(id, 10);
  
  const { data: items = [], isLoading } = useMenuItems();
  const item = items.find((i) => i.id === menuItemId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="rounded-xl border-2 border-rose-200 bg-rose-50 p-8 text-center">
        <p className="text-sm font-semibold text-rose-900">Menu item not found</p>
        <Link href="/app/menu-items" className="mt-4 inline-block text-sm text-primary hover:underline">
          Back to Menu Items
        </Link>
      </div>
    );
  }

  return <MenuItemForm item={item} />;
}
