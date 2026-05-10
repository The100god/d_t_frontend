import React, { useRef, useState, useEffect } from 'react';

const DrawingCanvas = ({ onSave }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [ctx, setCtx] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = canvas.offsetWidth;
    canvas.height = 300;
    const context = canvas.getContext('2d');
    context.lineCap = 'round';
    context.strokeStyle = '#ffffff';
    context.lineWidth = 3;
    setCtx(context);
  }, []);

  const startDrawing = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = nativeEvent;
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
  };

  const stopDrawing = () => {
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
      <div className="border border-white/20 rounded-xl overflow-hidden bg-black/40">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="w-full cursor-crosshair"
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
