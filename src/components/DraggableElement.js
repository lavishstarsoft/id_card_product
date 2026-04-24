'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';

export default function DraggableElement({ 
  children, 
  className = '', 
  style = {}, 
  resizable = false,
  initialWidth = null,
  initialHeight = null,
  initialPosition = { x: 0, y: 0 },
  onTransformChange = null,
}) {
  const [position, setPosition] = useState(initialPosition);
  const [size, setSize] = useState({ 
    width: initialWidth, 
    height: initialHeight 
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const elRef = useRef(null);
  const startPos = useRef({ x: 0, y: 0 });
  const startOffset = useRef({ x: 0, y: 0 });
  const startSize = useRef({ width: 0, height: 0 });
  const startPosition = useRef({ x: 0, y: 0 });
  const onTransformChangeRef = useRef(onTransformChange);

  // Click outside to deselect
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (elRef.current && !elRef.current.contains(e.target)) {
        setIsSelected(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    onTransformChangeRef.current = onTransformChange;
  }, [onTransformChange]);

  useEffect(() => {
    onTransformChangeRef.current?.({
      x: position.x,
      y: position.y,
      width: size.width,
      height: size.height
    });
  }, [position.x, position.y, size.width, size.height]);

  // --- DRAG (move) ---
  const handleMouseDown = useCallback((e) => {
    if (isResizing) return;
    e.preventDefault();
    e.stopPropagation();
    setIsSelected(true);
    elRef.current?.focus();
    setIsDragging(true);
    startPos.current = { x: e.clientX, y: e.clientY };
    startOffset.current = { x: position.x, y: position.y };

    const handleMouseMove = (e) => {
      const dx = e.clientX - startPos.current.x;
      const dy = e.clientY - startPos.current.y;
      setPosition({
        x: startOffset.current.x + dx,
        y: startOffset.current.y + dy,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [position, isResizing]);

  const handleTouchStart = useCallback((e) => {
    if (isResizing) return;
    const touch = e.touches[0];
    setIsSelected(true);
    elRef.current?.focus();
    setIsDragging(true);
    startPos.current = { x: touch.clientX, y: touch.clientY };
    startOffset.current = { x: position.x, y: position.y };

    const handleTouchMove = (e) => {
      const touch = e.touches[0];
      const dx = touch.clientX - startPos.current.x;
      const dy = touch.clientY - startPos.current.y;
      setPosition({
        x: startOffset.current.x + dx,
        y: startOffset.current.y + dy,
      });
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
  }, [position, isResizing]);

  const handleKeyDown = useCallback((e) => {
    const keyToDelta = {
      ArrowUp: { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 },
      ArrowLeft: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 },
    };

    const delta = keyToDelta[e.key];
    if (!delta) return;

    e.preventDefault();
    const step = e.shiftKey ? 10 : 1;

    setPosition((prev) => ({
      x: prev.x + (delta.x * step),
      y: prev.y + (delta.y * step),
    }));
  }, []);

  // --- RESIZE via handles ---
  const handleResizeMouseDown = useCallback((e, handle) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);

    startPos.current = { x: e.clientX, y: e.clientY };
    startSize.current = { width: size.width || 100, height: size.height || 100 };
    startPosition.current = { x: position.x, y: position.y };

    const handleMouseMove = (e) => {
      const dx = e.clientX - startPos.current.x;
      const dy = e.clientY - startPos.current.y;

      let newWidth = startSize.current.width;
      let newHeight = startSize.current.height;
      let newX = startPosition.current.x;
      let newY = startPosition.current.y;

      // 8-directional resize
      switch (handle) {
        case 'e':  // right edge
          newWidth = Math.max(20, startSize.current.width + dx);
          break;
        case 'w':  // left edge
          newWidth = Math.max(20, startSize.current.width - dx);
          newX = startPosition.current.x + dx;
          break;
        case 's':  // bottom edge
          newHeight = Math.max(20, startSize.current.height + dy);
          break;
        case 'n':  // top edge
          newHeight = Math.max(20, startSize.current.height - dy);
          newY = startPosition.current.y + dy;
          break;
        case 'se': // bottom-right
          newWidth = Math.max(20, startSize.current.width + dx);
          newHeight = Math.max(20, startSize.current.height + dy);
          break;
        case 'sw': // bottom-left
          newWidth = Math.max(20, startSize.current.width - dx);
          newHeight = Math.max(20, startSize.current.height + dy);
          newX = startPosition.current.x + dx;
          break;
        case 'ne': // top-right
          newWidth = Math.max(20, startSize.current.width + dx);
          newHeight = Math.max(20, startSize.current.height - dy);
          newY = startPosition.current.y + dy;
          break;
        case 'nw': // top-left
          newWidth = Math.max(20, startSize.current.width - dx);
          newHeight = Math.max(20, startSize.current.height - dy);
          newX = startPosition.current.x + dx;
          newY = startPosition.current.y + dy;
          break;
      }

      setSize({ width: Math.round(newWidth), height: Math.round(newHeight) });
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [size, position]);

  const showHandles = resizable && isSelected;

  const combinedStyle = {
    ...style,
    transform: `translate(${position.x}px, ${position.y}px)`,
    cursor: isDragging ? 'grabbing' : 'move',
    userSelect: 'none',
    touchAction: 'none',
    ...(size.width ? { width: size.width + 'px' } : {}),
    ...(size.height ? { height: size.height + 'px' } : {}),
    outline: isSelected ? '2px solid #3b82f6' : 'none',
  };

  // Handle styles for Photoshop-like transform box
  const cornerHandle = (cursor, pos) => ({
    position: 'absolute',
    width: '8px',
    height: '8px',
    background: 'white',
    border: '2px solid #3b82f6',
    cursor: cursor,
    zIndex: 25,
    ...pos,
  });

  const edgeHandle = (cursor, pos) => ({
    position: 'absolute',
    background: 'transparent',
    cursor: cursor,
    zIndex: 24,
    ...pos,
  });

  return (
    <div
      ref={elRef}
      className={className}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onKeyDown={handleKeyDown}
      onFocus={() => setIsSelected(true)}
      tabIndex={0}
      style={combinedStyle}
    >
      {children}

      {showHandles && (
        <>
          {/* 4 Corner handles */}
          <div style={cornerHandle('nw-resize', { top: -4, left: -4 })} onMouseDown={(e) => handleResizeMouseDown(e, 'nw')} />
          <div style={cornerHandle('ne-resize', { top: -4, right: -4 })} onMouseDown={(e) => handleResizeMouseDown(e, 'ne')} />
          <div style={cornerHandle('sw-resize', { bottom: -4, left: -4 })} onMouseDown={(e) => handleResizeMouseDown(e, 'sw')} />
          <div style={cornerHandle('se-resize', { bottom: -4, right: -4 })} onMouseDown={(e) => handleResizeMouseDown(e, 'se')} />

          {/* 4 Edge handles */}
          <div style={edgeHandle('n-resize', { top: -3, left: '20%', right: '20%', height: '6px' })} onMouseDown={(e) => handleResizeMouseDown(e, 'n')} />
          <div style={edgeHandle('s-resize', { bottom: -3, left: '20%', right: '20%', height: '6px' })} onMouseDown={(e) => handleResizeMouseDown(e, 's')} />
          <div style={edgeHandle('w-resize', { left: -3, top: '20%', bottom: '20%', width: '6px' })} onMouseDown={(e) => handleResizeMouseDown(e, 'w')} />
          <div style={edgeHandle('e-resize', { right: -3, top: '20%', bottom: '20%', width: '6px' })} onMouseDown={(e) => handleResizeMouseDown(e, 'e')} />

          {/* Size indicator */}
          <div style={{
            position: 'absolute',
            bottom: '-20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(30, 58, 138, 0.9)',
            color: 'white',
            fontSize: '10px',
            padding: '2px 6px',
            borderRadius: '3px',
            whiteSpace: 'nowrap',
            zIndex: 30,
            pointerEvents: 'none',
          }}>
            {size.width} × {size.height}
          </div>
        </>
      )}
    </div>
  );
}
