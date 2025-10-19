export const createStyles = (): string => {
  return `
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
  `;
};
