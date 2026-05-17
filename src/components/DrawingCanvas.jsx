import React, { useRef, useState, useEffect } from 'react';

const DrawingCanvas = ({ onSave, initialImage }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [ctx, setCtx] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const width = canvas.offsetWidth || window.innerWidth - 64;
    canvas.width = width;
    canvas.height = 300;
    const context = canvas.getContext('2d');
    context.lineCap = 'round';
    context.strokeStyle = '#ffffff';
    context.lineWidth = 3;
    setCtx(context);
  }, []);

  useEffect(() => {
    if (!ctx || !initialImage) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = initialImage;
    img.onload = () => {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height);
    };
  }, [ctx, initialImage]);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();

    // Support Touch Events
    const touch = (e.touches && e.touches[0]) ||
      (e.nativeEvent && e.nativeEvent.touches && e.nativeEvent.touches[0]) ||
      (e.changedTouches && e.changedTouches[0]);

    if (touch) {
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    }

    // Support Mouse Events
    const clientX = e.clientX ?? e.nativeEvent?.clientX ?? 0;
    const clientY = e.clientY ?? e.nativeEvent?.clientY ?? 0;

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    if (e.cancelable) e.preventDefault();
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    if (e.cancelable) e.preventDefault();
    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    ctx.closePath();
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const saveCanvas = () => {
    const dataUrl = canvasRef.current.toDataURL('image/png');
    onSave(dataUrl);
  };

  return (
    <div className="space-y-4">
      <div className="border border-white/20 rounded-xl overflow-hidden bg-black/0">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full cursor-crosshair touch-none"
        />
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={clearCanvas} className="btn-secondary text-sm">Clear</button>
        <button type="button" onClick={saveCanvas} className="btn-primary text-sm bg-vibrant-secondary">Confirm Drawing</button>
      </div>
    </div>
  );
};

export default DrawingCanvas;
