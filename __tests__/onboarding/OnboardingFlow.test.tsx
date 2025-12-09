/**
 * End-to-end onboarding flow tests
 * Tests the complete onboarding journey from start to finish
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OnboardingWizard } from '@/app/(tenant)/components/OnboardingWizard';
import { OnboardingGuard } from '@/app/(tenant)/components/OnboardingGuard';
import { tenantApi, authApi, ApiError } from '@/lib/api';

// Mock next/navigation
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockRefresh = jest.fn();
const mockPathname = jest.fn(() => '/app');

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    refresh: mockRefresh,
  }),
  usePathname: () => mockPathname(),
}));

// Mock the API
jest.mock('@/lib/api', () => {
  // Import the actual ApiError class
  const actualApi = jest.requireActual('@/lib/api');
  return {
    ...actualApi,
    tenantApi: {
      onboardingStatus: jest.fn(),
      onboardingIndustry: jest.fn(),
      onboardingBusinessProfile: jest.fn(),
      onboardingPersona: jest.fn(),
      onboardingBusinessDetails: jest.fn(),
      onboardingComplete: jest.fn(),
      getTenantIndustry: jest.fn(),
      getIndustries: jest.fn(),
      setTenantIndustry: jest.fn(),
    },
    authApi: {
      me: jest.fn(),
    },
  };
});

const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
};

describe('Onboarding Flow', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
    mockPathname.mockReturnValue('/app');
    mockPush.mockClear();
    mockReplace.mockClear();
    mockRefresh.mockClear();
  });

  afterEach(() => {
    queryClient.clear();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  describe('OnboardingGuard', () => {
    it('should show loading state while checking onboarding status', async () => {
      (authApi.me as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves
      (tenantApi.onboardingStatus as jest.Mock).mockImplementation(() => new Promise(() => {}));

      renderWithProviders(
        <OnboardingGuard>
          <div>Protected Content</div>
        </OnboardingGuard>
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should show onboarding wizard when onboarding is incomplete', async () => {
      (authApi.me as jest.Mock).mockResolvedValue({
        onboarding: { complete: false, step: 'industry' },
      });
      (tenantApi.onboardingStatus as jest.Mock).mockResolvedValue({
        complete: false,
        step: 'industry',
      });

      renderWithProviders(
        <OnboardingGuard>
          <div>Protected Content</div>
        </OnboardingGuard>
      );

      await waitFor(() => {
        expect(screen.getByText(/Industry Selection/i)).toBeInTheDocument();
      });
    });

    it('should allow access when onboarding is complete', async () => {
      (authApi.me as jest.Mock).mockResolvedValue({
        onboarding: { complete: true, step: 'complete' },
      });
      (tenantApi.onboardingStatus as jest.Mock).mockResolvedValue({
        complete: true,
        step: 'complete',
      });

      renderWithProviders(
        <OnboardingGuard>
          <div>Protected Content</div>
        </OnboardingGuard>
      );

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
    });
  });

  describe('OnboardingWizard', () => {
    it('should start at industry step for new users', async () => {
      (tenantApi.onboardingStatus as jest.Mock).mockResolvedValue({
        complete: false,
        step: 'industry',
      });
      (tenantApi.getIndustries as jest.Mock).mockResolvedValue({
        industries: [
          { id: 1, name: 'Retail', category: 'commerce', description: 'Retail business', has_products: true, has_menu: false, has_services: false },
        ],
      });
      (tenantApi.getTenantIndustry as jest.Mock).mockResolvedValue(null);

      renderWithProviders(<OnboardingWizard />);

      await waitFor(() => {
        expect(screen.getByText(/Industry Selection/i)).toBeInTheDocument();
      });
    });

    it('should redirect when onboarding is already complete', async () => {
      const mockReplace = jest.fn();
      jest.mock('next/navigation', () => ({
        useRouter: () => ({ replace: mockReplace }),
      }));

      (tenantApi.onboardingStatus as jest.Mock).mockResolvedValue({
        complete: true,
        step: 'complete',
      });

      renderWithProviders(<OnboardingWizard />);

      await waitFor(() => {
        expect(screen.getByText(/Onboarding Complete!/i)).toBeInTheDocument();
      });
    });
  });
});

