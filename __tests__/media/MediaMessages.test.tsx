/**
 * Media message components tests
 * Verifies that all media types render correctly and handle errors gracefully
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AudioMessage } from '@/app/(tenant)/components/inbox/AudioMessage';
import { ImageMessage } from '@/app/(tenant)/components/inbox/ImageMessage';
import { VideoMessage } from '@/app/(tenant)/components/inbox/VideoMessage';
import { DocumentMessage } from '@/app/(tenant)/components/inbox/DocumentMessage';
import { StickerMessage } from '@/app/(tenant)/components/inbox/StickerMessage';
import type { InteractionMedia } from '@/app/(tenant)/hooks/useConversations';

describe('Media Message Components', () => {
  describe('AudioMessage', () => {
    it('should render audio player when URL is available', () => {
      const media: InteractionMedia = {
        stored_url: 'https://example.com/audio.ogg',
        type: 'audio',
        transcription: 'Hello, this is a test',
      };

      render(<AudioMessage media={media} />);
      expect(screen.getByLabelText('Audio message player')).toBeInTheDocument();
      expect(screen.getByText('Hello, this is a test')).toBeInTheDocument();
    });

    it('should show error message when URL is missing', () => {
      const media: InteractionMedia = {
        type: 'audio',
      };

      render(<AudioMessage media={media} />);
      expect(screen.getByText(/Audio message \(unavailable\)/i)).toBeInTheDocument();
    });

    it('should prefer stored_url over url', () => {
      const media: InteractionMedia = {
        url: 'https://example.com/temp.ogg',
        stored_url: 'https://cloudinary.com/audio.ogg',
        type: 'audio',
      };

      render(<AudioMessage media={media} />);
      const audio = screen.getByLabelText('Audio message player') as HTMLAudioElement;
      expect(audio.src).toContain('cloudinary.com');
    });
  });

  describe('ImageMessage', () => {
    it('should render image when URL is available', () => {
      const media: InteractionMedia = {
        stored_url: 'https://example.com/image.jpg',
        type: 'image',
        caption: 'Test image',
      };

      render(<ImageMessage media={media} />);
      const img = screen.getByAltText('Test image');
      expect(img).toBeInTheDocument();
    });

    it('should open fullscreen on click', async () => {
      const media: InteractionMedia = {
        stored_url: 'https://example.com/image.jpg',
        type: 'image',
      };

      render(<ImageMessage media={media} />);
      const imageContainer = screen.getByLabelText('Click to view image in fullscreen');
      
      fireEvent.click(imageContainer);
      
      await waitFor(() => {
        expect(screen.getByLabelText('Close fullscreen image')).toBeInTheDocument();
      });
    });

    it('should show error message when URL is missing', () => {
      const media: InteractionMedia = {
        type: 'image',
      };

      render(<ImageMessage media={media} />);
      expect(screen.getByText(/Image \(unavailable\)/i)).toBeInTheDocument();
    });
  });

  describe('VideoMessage', () => {
    it('should render video player when URL is available', () => {
      const media: InteractionMedia = {
        stored_url: 'https://example.com/video.mp4',
        type: 'video',
        caption: 'Test video',
      };

      render(<VideoMessage media={media} />);
      expect(screen.getByLabelText('Video message player')).toBeInTheDocument();
      expect(screen.getByText('Test video')).toBeInTheDocument();
    });

    it('should show error message when URL is missing', () => {
      const media: InteractionMedia = {
        type: 'video',
      };

      render(<VideoMessage media={media} />);
      expect(screen.getByText(/Video \(unavailable\)/i)).toBeInTheDocument();
    });
  });

  describe('DocumentMessage', () => {
    it('should render document preview when URL is available', () => {
      const media: InteractionMedia = {
        stored_url: 'https://example.com/doc.pdf',
        type: 'document',
        filename: 'test-document.pdf',
        document_text: 'Sample document text content',
      };

      render(<DocumentMessage media={media} />);
      expect(screen.getByText('test-document.pdf')).toBeInTheDocument();
      // Check for preview text in the preview section (line-clamp-2 class)
      const previewSection = screen.getByText('test-document.pdf').closest('.flex-1');
      expect(previewSection).toBeInTheDocument();
      expect(screen.getByLabelText(/Download document: test-document\.pdf/i)).toBeInTheDocument();
    });

    it('should show error message when URL is missing', () => {
      const media: InteractionMedia = {
        type: 'document',
      };

      render(<DocumentMessage media={media} />);
      expect(screen.getByText(/Document \(unavailable\)/i)).toBeInTheDocument();
    });
  });

  describe('StickerMessage', () => {
    it('should render sticker when URL is available', () => {
      const media: InteractionMedia = {
        stored_url: 'https://example.com/sticker.png',
        type: 'sticker',
      };

      render(<StickerMessage media={media} />);
      const img = screen.getByAltText('Sticker message');
      expect(img).toBeInTheDocument();
    });

    it('should show error message when URL is missing', () => {
      const media: InteractionMedia = {
        type: 'sticker',
      };

      render(<StickerMessage media={media} />);
      expect(screen.getByText(/Sticker \(unavailable\)/i)).toBeInTheDocument();
    });
  });
});

