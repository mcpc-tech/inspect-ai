import React, { useState, useRef, useEffect } from 'react';
import type { InspectedElement } from '../types';

interface FeedbackBubbleProps {
  sourceInfo: InspectedElement;
  element: Element;
  onSubmit: (feedback: string) => void;
  onClose: () => void;
}

export const FeedbackBubble: React.FC<FeedbackBubbleProps> = ({
  sourceInfo,
  element,
  onSubmit,
  onClose,
}) => {
  const [feedback, setFeedback] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    positionBubble();
  }, [element]);

  const positionBubble = () => {
    const rect = element.getBoundingClientRect();
    if (bubbleRef.current) {
      bubbleRef.current.style.position = 'fixed';
      bubbleRef.current.style.top = rect.bottom + 10 + 'px';
      bubbleRef.current.style.left = Math.max(10, rect.left) + 'px';

      setTimeout(() => {
        if (bubbleRef.current) {
          const bubbleRect = bubbleRef.current.getBoundingClientRect();
          if (bubbleRect.right > window.innerWidth - 10) {
            bubbleRef.current.style.left = window.innerWidth - bubbleRect.width - 10 + 'px';
          }
        }
      }, 0);
    }
  };

  const handleSubmit = () => {
    if (feedback.trim()) {
      onSubmit(feedback);
    }
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const location = sourceInfo.line ? `${sourceInfo.line}:${sourceInfo.column}` : 'unknown';
  const infoText = `${sourceInfo.component} • ${sourceInfo.file}:${location}`;

  return (
    <div
      ref={bubbleRef}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
      }}
      style={{
        background: '#fff',
        color: '#000',
        padding: '16px 20px',
        borderRadius: '12px',
        fontSize: '13px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
        border: '1px solid #e5e5e5',
        animation: 'slideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        maxWidth: '360px',
        pointerEvents: 'auto',
        zIndex: 1000000,
      }}
    >
      <div
        style={{
          fontWeight: 700,
          marginBottom: '12px',
          paddingBottom: '12px',
          borderBottom: '1px solid #e5e5e5',
          color: '#000',
          fontSize: '13px',
        }}
      >
        Feedback to AI
      </div>

      <div
        style={{
          fontSize: '12px',
          color: '#666',
          marginBottom: '12px',
          fontWeight: 400,
        }}
      >
        {infoText}
      </div>

      <input
        ref={inputRef}
        type="text"
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="请输入修改诉求..."
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: '10px 12px',
          border: '1px solid #d9d9d9',
          borderRadius: '8px',
          background: '#fafafa',
          color: '#000',
          fontSize: '13px',
          fontFamily: 'inherit',
          marginBottom: '12px',
          transition: 'all 0.2s ease',
          outline: 'none',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = '#000';
          e.currentTarget.style.background = '#fff';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = '#d9d9d9';
          e.currentTarget.style.background = '#fafafa';
        }}
      />

      <div
        style={{
          display: 'flex',
          gap: '10px',
          justifyContent: 'flex-end',
        }}
      >
        <button
          onClick={onClose}
          style={{
            padding: '8px 16px',
            border: '1px solid #d9d9d9',
            borderRadius: '8px',
            fontSize: '13px',
            cursor: 'pointer',
            background: '#f5f5f5',
            color: '#000',
            transition: 'all 0.2s ease',
            fontWeight: 500,
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = '#efefef';
            e.currentTarget.style.borderColor = '#ccc';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = '#f5f5f5';
            e.currentTarget.style.borderColor = '#d9d9d9';
          }}
        >
          取消
        </button>
        <button
          onClick={handleSubmit}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            cursor: 'pointer',
            background: '#000',
            color: '#fff',
            transition: 'all 0.2s ease',
            fontWeight: 500,
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = '#1f1f1f';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = '#000';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          提交
        </button>
      </div>
    </div>
  );
};
