'use client';

import React from 'react';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/app/(tenant)/components/ui/Modal';
import { Button } from '@/app/(tenant)/components/ui/Button';

type Props = {
  open: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmModal({
  open,
  title = 'Confirm',
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal open={open} onClose={onCancel} size="sm">
      <ModalHeader onClose={onCancel}>
        <ModalTitle>{title}</ModalTitle>
      </ModalHeader>
      {description && (
        <ModalBody>
          <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
        </ModalBody>
      )}
      <ModalFooter>
        <Button variant="secondary" onClick={onCancel}>
          {cancelText}
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          {confirmText}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
