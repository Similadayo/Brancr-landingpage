/**
 * Accessibility tests
 * Verifies ARIA labels, keyboard navigation, and screen reader support
 */

import { render, screen } from '@testing-library/react';
import { AudioMessage } from '@/app/(tenant)/components/inbox/AudioMessage';
import { ImageMessage } from '@/app/(tenant)/components/inbox/ImageMessage';
import { DocumentMessage } from '@/app/(tenant)/components/inbox/DocumentMessage';
import type { InteractionMedia } from '@/app/(tenant)/hooks/useConversations';

describe('Accessibility', () => {
  describe('Media Components', () => {
    it('AudioMessage should have aria-label on audio element', () => {
      const media: InteractionMedia = {
        stored_url: 'https://example.com/audio.ogg',
        type: 'audio',
      };
      render(<AudioMessage media={media} />);
      expect(screen.getByLabelText('Audio message player')).toBeInTheDocument();
    });

    it('ImageMessage should be keyboard accessible', () => {
      const media: InteractionMedia = {
        stored_url: 'https://example.com/image.jpg',
        type: 'image',
      };
      render(<ImageMessage media={media} />);
      const imageContainer = screen.getByLabelText('Click to view image in fullscreen');
      expect(imageContainer).toHaveAttribute('role', 'button');
      expect(imageContainer).toHaveAttribute('tabIndex', '0');
    });

    it('DocumentMessage should have descriptive download link', () => {
      const media: InteractionMedia = {
        stored_url: 'https://example.com/doc.pdf',
        type: 'document',
        filename: 'test-document.pdf',
      };
      render(<DocumentMessage media={media} />);
      expect(screen.getByLabelText(/Download document: test-document\.pdf/i)).toBeInTheDocument();
    });
  });

  describe('Form Accessibility', () => {
    it('should have proper labels for form inputs', () => {
      // This would test forms in onboarding, campaigns, etc.
      // Implementation depends on specific form components
    });
  });
});

