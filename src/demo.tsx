import { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import Stats from './components/Stats';
import RequestList from './components/RequestList';
import Toast from './components/Toast';
import GetRequest from './components/GetRequest';
import Controls from './components/Controls';
import RequestDetail from './components/RequestDetail';
import {
  clearNetworkRequests,
  getNetworkRequestCount,
} from './index';
import { 
  initInterceptors, 
  getEnhancedRequests, 
  clearEnhancedRequests,
  type EnhancedNetworkRequest 
} from './interceptor';

// 初始化拦截器
initInterceptors();

const POLL_MS = 1500;

function useAutoRefresh(cb: () => void, deps: any[] = []) {
  useEffect(() => {
    cb();
    const id = setInterval(cb, POLL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export default function App() {
  const [stats, setStats] = useState({ total: 0, fetch: 0, xhr: 0, other: 0 });
  const [requests, setRequests] = useState<EnhancedNetworkRequest[]>([]);
  const [url, setUrl] = useState('https://jsonplaceholder.typicode.com/posts/1');
  const [selectedRequest, setSelectedRequest] = useState<EnhancedNetworkRequest | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const refresh = useCallback(() => {
    try {
      const total = getNetworkRequestCount();
      const fetch = getNetworkRequestCount(['fetch']);
      const xhr = getNetworkRequestCount(['xmlhttprequest']);
      const other = total - fetch - xhr;
      setStats({ total, fetch, xhr, other });
      
      // 获取增强的请求列表
      const enhancedReqs = getEnhancedRequests();
      setRequests(enhancedReqs);
    } catch (err) {
      // ignore during init
    }
  }, []);

  useAutoRefresh(refresh, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleGet = async () => {
    if (!url.trim()) return showToast('Please enter a URL', 'error');
    
    try {
      // 发起实际请求，会被拦截器自动捕获
      const response = await fetch(url);
      await response.json();
      
      // 等待一小段时间让拦截器处理完成
      setTimeout(() => {
        refresh();
        // 查找刚发起的请求
        const reqs = getEnhancedRequests();
        const found = reqs.find(r => r.url === url);
        if (found) {
          setSelectedRequest(found);
          showToast('Request captured successfully');
        }
      }, 200);
    } catch (err: any) {
      showToast('Request failed: ' + err.message, 'error');
      setTimeout(refresh, 200);
    }
  };

  const handleSelectRequest = (request: EnhancedNetworkRequest) => {
    setSelectedRequest(request);
    showToast('Request details loaded');
  };

  const handleClear = () => {
    if (confirm('Clear all recorded network requests?')) {
      clearNetworkRequests();
      clearEnhancedRequests();
      setSelectedRequest(null);
      refresh();
      showToast('Cleared');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🔍 Inspect API</h1>
          <p className="text-gray-600 mt-1">Live network inspection (auto-refresh)</p>
        </header>

        <section className="mb-6">
          <Stats stats={stats} />
        </section>

        <section className="mb-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
              <h2 className="font-semibold text-gray-900 mb-3">Requests (live) - Click to view details</h2>
              <RequestList requests={requests} onSelect={handleSelectRequest} />
            </div>
          </div>

          <aside className="">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 mb-4">
              <h3 className="font-medium text-gray-900 mb-3">Test Request</h3>
              <GetRequest value={url} onChange={setUrl} onGet={handleGet} />
            </div>

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 mb-4">
              <h3 className="font-medium text-gray-900 mb-3">Request Details</h3>
              <RequestDetail request={selectedRequest} />
            </div>

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
              <h3 className="font-medium text-gray-900 mb-3">Actions</h3>
              <Controls onClear={handleClear} />
            </div>
          </aside>
        </section>

        <section className="text-sm text-gray-500">Last refreshed every {POLL_MS / 1000}s (auto)</section>
      </div>
    </div>
  );
}

// Mount
const root = createRoot(document.getElementById('root')!);
root.render(<App />);
