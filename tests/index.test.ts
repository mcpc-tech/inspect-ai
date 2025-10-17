import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  listNetworkRequests, 
  getNetworkRequest, 
  clearNetworkRequests,
  getNetworkRequestCount,
  type NetworkRequest 
} from '../src'

// Mock Performance API
const mockEntries: PerformanceResourceTiming[] = [
  {
    name: 'https://api.example.com/users',
    initiatorType: 'fetch',
    duration: 123.45,
    transferSize: 1024,
    encodedBodySize: 512,
    decodedBodySize: 1024,
    startTime: 100,
    fetchStart: 100,
    responseEnd: 223.45,
    nextHopProtocol: 'h2'
  } as PerformanceResourceTiming,
  {
    name: 'https://api.example.com/posts',
    initiatorType: 'xmlhttprequest',
    duration: 89.12,
    transferSize: 2048,
    encodedBodySize: 1024,
    decodedBodySize: 2048,
    startTime: 150,
    fetchStart: 150,
    responseEnd: 239.12,
    nextHopProtocol: 'h2'
  } as PerformanceResourceTiming,
  {
    name: 'https://cdn.example.com/script.js',
    initiatorType: 'script',
    duration: 45.67,
    transferSize: 4096,
    encodedBodySize: 2048,
    decodedBodySize: 4096,
    startTime: 50,
    fetchStart: 50,
    responseEnd: 95.67,
    nextHopProtocol: 'http/1.1'
  } as PerformanceResourceTiming
]

describe('Network Request Tools', () => {
  beforeEach(() => {
    // Mock performance.getEntriesByType
    vi.spyOn(performance, 'getEntriesByType').mockReturnValue(mockEntries)
  })

  describe('listNetworkRequests', () => {
    it('should return all requests when no options provided', () => {
      const requests = listNetworkRequests()
      expect(requests).toHaveLength(3)
      expect(requests[0].url).toBe('https://api.example.com/users')
    })

    it('should filter by resource types', () => {
      const requests = listNetworkRequests({ 
        resourceTypes: ['fetch', 'xmlhttprequest'] 
      })
      expect(requests).toHaveLength(2)
      expect(requests.every(r => ['fetch', 'xmlhttprequest'].includes(r.type))).toBe(true)
    })

    it('should support pagination', () => {
      const page1 = listNetworkRequests({ pageSize: 2, pageIdx: 0 })
      expect(page1).toHaveLength(2)
      expect(page1[0].url).toBe('https://api.example.com/users')
      
      const page2 = listNetworkRequests({ pageSize: 2, pageIdx: 1 })
      expect(page2).toHaveLength(1)
      expect(page2[0].url).toBe('https://cdn.example.com/script.js')
    })

    it('should return correct NetworkRequest structure', () => {
      const requests = listNetworkRequests()
      const request = requests[0]
      
      expect(request).toHaveProperty('url')
      expect(request).toHaveProperty('type')
      expect(request).toHaveProperty('duration')
      expect(request).toHaveProperty('transferSize')
      expect(request).toHaveProperty('encodedBodySize')
      expect(request).toHaveProperty('decodedBodySize')
      expect(request).toHaveProperty('startTime')
      expect(request).toHaveProperty('fetchStart')
      expect(request).toHaveProperty('responseEnd')
      expect(request).toHaveProperty('protocol')
    })
  })

  describe('getNetworkRequest', () => {
    it('should return request by URL', () => {
      const request = getNetworkRequest('https://api.example.com/users')
      expect(request).not.toBeNull()
      expect(request?.url).toBe('https://api.example.com/users')
      expect(request?.type).toBe('fetch')
      expect(request?.duration).toBe(123.45)
    })

    it('should return null for non-existent URL', () => {
      const request = getNetworkRequest('https://notfound.com')
      expect(request).toBeNull()
    })
  })

  describe('getNetworkRequestCount', () => {
    it('should return total count', () => {
      const count = getNetworkRequestCount()
      expect(count).toBe(3)
    })

    it('should return filtered count', () => {
      const count = getNetworkRequestCount(['fetch'])
      expect(count).toBe(1)
    })
  })

  describe('clearNetworkRequests', () => {
    it('should call performance.clearResourceTimings', () => {
      const spy = vi.spyOn(performance, 'clearResourceTimings')
      clearNetworkRequests()
      expect(spy).toHaveBeenCalled()
    })
  })
})

