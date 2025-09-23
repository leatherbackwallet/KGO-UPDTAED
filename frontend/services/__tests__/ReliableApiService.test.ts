import { ReliableApiService } from '../ReliableApiService';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

describe('ReliableApiService', () => {
  let service: ReliableApiService;
  let mockAxiosInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockAxiosInstance = {
      create: jest.fn().mockReturnThis(),
      request: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() }
      },
      defaults: {
        baseURL: 'http://localhost:3001'
      }
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance);
    
    service = new ReliableApiService('http://localhost:3001');
  });

  afterEach(() => {
    service.destroy();
  });

  it('should create instance with correct configuration', () => {
    expect(mockedAxios.create).toHaveBeenCalledWith({
      baseURL: 'http://localhost:3001',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
  });

  it('should make successful GET request', async () => {
    const mockData = { id: 1, name: 'Test Product' };
    mockAxiosInstance.request.mockResolvedValue({
      data: mockData,
      status: 200
    });

    const result = await service.get('/products');

    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockData);
    expect(result.cached).toBe(false);
    expect(mockAxiosInstance.request).toHaveBeenCalledWith({
      method: 'get',
      url: '/products',
      data: undefined,
      timeout: 10000,
    });
  });

  it('should cache GET responses', async () => {
    const mockData = { id: 1, name: 'Test Product' };
    mockAxiosInstance.request.mockResolvedValue({
      data: mockData,
      status: 200
    });

    // First request
    await service.get('/products');
    
    // Second request should come from cache
    const result = await service.get('/products', { cacheStrategy: 'cache-first' });

    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockData);
    expect(result.cached).toBe(true);
    expect(mockAxiosInstance.request).toHaveBeenCalledTimes(1);
  });

  it('should handle network errors with retry', async () => {
    const networkError = new Error('Network Error');
    mockAxiosInstance.request
      .mockRejectedValueOnce(networkError)
      .mockRejectedValueOnce(networkError)
      .mockResolvedValue({
        data: { success: true },
        status: 200
      });

    const result = await service.get('/products', { retries: 2 });

    expect(result.success).toBe(true);
    expect(mockAxiosInstance.request).toHaveBeenCalledTimes(3);
  });

  it('should respect cache-only strategy', async () => {
    // First, populate cache
    const mockData = { id: 1, name: 'Test Product' };
    mockAxiosInstance.request.mockResolvedValue({
      data: mockData,
      status: 200
    });

    await service.get('/products');

    // Now use cache-only strategy
    const result = await service.get('/products', { cacheStrategy: 'cache-only' });

    expect(result.success).toBe(true);
    expect(result.cached).toBe(true);
    expect(mockAxiosInstance.request).toHaveBeenCalledTimes(1); // Only the first call
  });

  it('should throw error for cache-only when no cache exists', async () => {
    await expect(
      service.get('/products', { cacheStrategy: 'cache-only' })
    ).rejects.toThrow('No cached data available and cache-only strategy specified');
  });

  it('should clear cache correctly', () => {
    // Populate cache first
    service.get('/products').catch(() => {}); // Ignore errors for this test
    
    const statsBefore = service.getCacheStats();
    service.clearCache();
    const statsAfter = service.getCacheStats();

    expect(statsAfter.size).toBe(0);
  });

  it('should provide cache statistics', async () => {
    // Create a fresh service instance for this test
    const freshService = new ReliableApiService('http://localhost:3001');
    
    const mockData = { id: 1, name: 'Test Product' };
    mockAxiosInstance.request.mockResolvedValue({
      data: mockData,
      status: 200
    });

    // Make a request to populate cache
    await freshService.get('/products');
    
    // Make another request that should hit cache
    await freshService.get('/products', { cacheStrategy: 'cache-first' });

    const stats = freshService.getCacheStats();
    expect(stats.hits).toBeGreaterThanOrEqual(1);
    expect(stats.size).toBe(1);
    expect(stats.hitRate).toBeGreaterThan(0);
    
    freshService.destroy();
  });

  it('should handle POST requests without caching', async () => {
    const postData = { name: 'New Product' };
    const responseData = { id: 2, ...postData };
    
    mockAxiosInstance.request.mockResolvedValue({
      data: responseData,
      status: 201
    });

    const result = await service.post('/products', postData);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(responseData);
    expect(result.cached).toBe(false);
    expect(mockAxiosInstance.request).toHaveBeenCalledWith({
      method: 'post',
      url: '/products',
      data: postData,
      timeout: 10000,
    });
  });
});