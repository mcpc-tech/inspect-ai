export const createStyles = (): string => {
  return `
    #source-inspector-btn {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #1f1f1f;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.24);
      z-index: 999998;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    #source-inspector-btn:hover {
      transform: scale(1.08);
      background: #0f0f0f;
      box-shadow: 0 6px 24px rgba(0, 0, 0, 0.32);
    }
    #source-inspector-btn.active {
      background: #000;
      animation: pulse 1.5s ease-in-out infinite;
    }
    #source-inspector-btn svg {
      width: 24px;
      height: 24px;
      fill: #fff;
    }
    @keyframes pulse {
      0%, 100% { box-shadow: 0 4px 16px rgba(0, 0, 0, 0.24); }
      50% { box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4); }
    }
    .source-inspector-overlay {
      position: fixed;
      pointer-events: none;
      border: 2px solid #000;
      background: rgba(0, 0, 0, 0.06);
      z-index: 999997;
      display: none;
    }
    .source-inspector-tooltip {
      position: fixed;
      background: #1f1f1f;
      color: #fff;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 12px;
      z-index: 999999;
      pointer-events: none;
      display: none;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.24);
      border: none;
      font-weight: 500;
    }
    .source-inspector-notification {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #000;
      color: #fff;
      padding: 14px 18px;
      border-radius: 10px;
      font-size: 13px;
      z-index: 1000000;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.24);
      animation: slideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      max-width: 400px;
      border: none;
      font-weight: 500;
    }
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;
};
