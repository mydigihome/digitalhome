import { useState, useRef, useEffect, useCallback } from 'react';
import { Pencil, Type, Plus, ImageIcon, MoreHorizontal, Trash2, Copy, ArrowUp, ArrowDown, RotateCcw, Undo2, Redo2, MousePointer2, GripVertical } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

// ── Types ──────────────────────────────────────────────────
interface CollageElement {
  id: string;
  type: 'image' | 'text' | 'drawing';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  src?: string;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fill?: string;
  points?: number[];
  stroke?: string;
  strokeWidth?: number;
}

const genId = () => `el-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// ── Resizable/Draggable Element ────────────────────────────
const CollageItem = ({
  el,
  isSelected,
  onSelect,
  onChange,
  boardRef,
}: {
  el: CollageElement;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (attrs: Partial<CollageElement>) => void;
  boardRef: React.RefObject<HTMLDivElement>;
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, elX: 0, elY: 0 });
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0, corner: '' });
  const rotateStart = useRef({ angle: 0, startAngle: 0 });
  const [isEditing, setIsEditing] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditing) return;
    e.stopPropagation();
    onSelect();
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, elX: el.x, elY: el.y };
  };

  const handleResizeStart = (e: React.MouseEvent, corner: string) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    resizeStart.current = { x: e.clientX, y: e.clientY, w: el.width, h: el.height, corner };
  };

  const handleRotateStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsRotating(true);
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = el.x + el.width / 2;
    const cy = el.y + el.height / 2;
    const startAngle = Math.atan2(e.clientY - rect.top - cy, e.clientX - rect.left - cx) * (180 / Math.PI);
    rotateStart.current = { angle: el.rotation, startAngle };
  };

  useEffect(() => {
    if (!isDragging && !isResizing && !isRotating) return;

    const handleMove = (e: MouseEvent) => {
      if (isDragging) {
        const dx = e.clientX - dragStart.current.x;
        const dy = e.clientY - dragStart.current.y;
        onChange({ x: dragStart.current.elX + dx, y: dragStart.current.elY + dy });
      }
      if (isResizing) {
        const dx = e.clientX - resizeStart.current.x;
        const dy = e.clientY - resizeStart.current.y;
        const { corner, w, h } = resizeStart.current;
        let newW = w, newH = h;
        if (corner.includes('right')) newW = Math.max(40, w + dx);
        if (corner.includes('left')) newW = Math.max(40, w - dx);
        if (corner.includes('bottom')) newH = Math.max(40, h + dy);
        if (corner.includes('top')) newH = Math.max(40, h - dy);

        const updates: Partial<CollageElement> = { width: newW, height: newH };
        if (corner.includes('left')) updates.x = el.x + (el.width - newW);
        if (corner.includes('top')) updates.y = el.y + (el.height - newH);
        onChange(updates);
      }
      if (isRotating) {
        const rect = boardRef.current?.getBoundingClientRect();
        if (!rect) return;
        const cx = el.x + el.width / 2;
        const cy = el.y + el.height / 2;
        const angle = Math.atan2(e.clientY - rect.top - cy, e.clientX - rect.left - cx) * (180 / Math.PI);
        const diff = angle - rotateStart.current.startAngle;
        onChange({ rotation: rotateStart.current.angle + diff });
      }
    };

    const handleUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setIsRotating(false);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isDragging, isResizing, isRotating]);

  const handleDoubleClick = () => {
    if (el.type === 'text') setIsEditing(true);
  };

  const corners = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];

  return (
    <div
      className="absolute group"
      style={{
        left: el.x,
        top: el.y,
        width: el.width,
        height: el.height,
        transform: `rotate(${el.rotation}deg)`,
        zIndex: isSelected ? 50 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      {/* Content */}
      {el.type === 'image' && el.src && (
        <img
          src={el.src}
          alt=""
          className="w-full h-full object-cover rounded-lg pointer-events-none select-none"
          draggable={false}
          style={{ boxShadow: isSelected ? '0 0 0 2px hsl(258 89% 66%)' : '0 2px 8px rgba(0,0,0,0.1)' }}
        />
      )}

      {el.type === 'text' && !isEditing && (
        <div
          className="w-full h-full flex items-center justify-center p-2 select-none"
          style={{
            fontSize: el.fontSize || 24,
            fontFamily: el.fontFamily || 'Georgia, serif',
            color: el.fill || '#37352F',
            outline: isSelected ? '2px solid hsl(258 89% 66%)' : 'none',
            borderRadius: 8,
            background: isSelected ? 'hsl(258 89% 66% / 0.05)' : 'transparent',
          }}
        >
          {el.text || 'Double-click to edit'}
        </div>
      )}

      {el.type === 'text' && isEditing && (
        <textarea
          autoFocus
          defaultValue={el.text || ''}
          className="w-full h-full p-2 resize-none border-2 rounded-lg bg-card outline-none"
          style={{
            fontSize: el.fontSize || 24,
            fontFamily: el.fontFamily || 'Georgia, serif',
            color: el.fill || '#37352F',
            borderColor: 'hsl(258 89% 66%)',
          }}
          onBlur={(e) => {
            setIsEditing(false);
            onChange({ text: e.target.value });
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsEditing(false);
              onChange({ text: (e.target as HTMLTextAreaElement).value });
            }
          }}
        />
      )}

      {el.type === 'drawing' && el.points && (
        <svg className="w-full h-full pointer-events-none" viewBox={`0 0 ${el.width} ${el.height}`}>
          <polyline
            points={el.points.reduce((acc, val, i) => {
              if (i % 2 === 0) return acc + (i > 0 ? ' ' : '') + val;
              return acc + ',' + val;
            }, '')}
            fill="none"
            stroke={el.stroke || '#37352F'}
            strokeWidth={el.strokeWidth || 3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}

      {/* Selection handles */}
      {isSelected && !isEditing && (
        <>
          {corners.map((corner) => (
            <div
              key={corner}
              className="absolute w-3 h-3 bg-card border-2 rounded-full z-50"
              style={{
                borderColor: 'hsl(258 89% 66%)',
                top: corner.includes('top') ? -6 : undefined,
                bottom: corner.includes('bottom') ? -6 : undefined,
                left: corner.includes('left') ? -6 : undefined,
                right: corner.includes('right') ? -6 : undefined,
                cursor: corner === 'top-left' || corner === 'bottom-right' ? 'nwse-resize' : 'nesw-resize',
              }}
              onMouseDown={(e) => handleResizeStart(e, corner)}
            />
          ))}

          {/* Rotate handle */}
          <div
            className="absolute -top-8 left-1/2 -translate-x-1/2 w-5 h-5 bg-card border-2 rounded-full flex items-center justify-center z-50"
            style={{ borderColor: 'hsl(258 89% 66%)', cursor: 'grab' }}
            onMouseDown={handleRotateStart}
          >
            <RotateCcw size={10} className="text-primary" />
          </div>
          <div className="absolute -top-4 left-1/2 w-px h-4 z-40" style={{ background: 'hsl(258 89% 66%)' }} />
        </>
      )}
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────
const VisionRoom = () => {
  const { user } = useAuth();
  const boardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [elements, setElements] = useState<CollageElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tool, setTool] = useState<'select' | 'draw' | 'text'>('select');
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState<number[]>([]);
  const [history, setHistory] = useState<CollageElement[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [showMore, setShowMore] = useState(false);
  const [boardId, setBoardId] = useState<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── History helpers ───────────────────────────────────
  const pushHistory = useCallback(
    (next: CollageElement[]) => {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(next);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    },
    [history, historyIndex],
  );

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setElements(history[historyIndex - 1]);
    }
  };
  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setElements(history[historyIndex + 1]);
    }
  };

  // ── Auto-save ─────────────────────────────────────────
  const saveBoard = useCallback(
    async (els: CollageElement[]) => {
      if (!user) return;
      if (boardId) {
        await supabase
          .from('vision_boards')
          .update({ elements: els as any, updated_at: new Date().toISOString() })
          .eq('id', boardId);
      } else {
        const { data } = await supabase
          .from('vision_boards')
          .insert({
            user_id: user.id,
            name: `Vision ${new Date().toLocaleDateString()}`,
            elements: els as any,
          })
          .select('id')
          .single();
        if (data) setBoardId(data.id);
      }
    },
    [user, boardId],
  );

  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveBoard(elements), 2000);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [elements, saveBoard]);

  // ── Load board ────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('vision_boards')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        setBoardId(data.id);
        setElements((data.elements as any) || []);
        setHistory([(data.elements as any) || []]);
      }
    })();
  }, [user]);

  // ── Element CRUD ──────────────────────────────────────
  const updateElement = (id: string, attrs: Partial<CollageElement>) => {
    const next = elements.map((el) => (el.id === id ? { ...el, ...attrs } : el));
    setElements(next);
    pushHistory(next);
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    const next = elements.filter((el) => el.id !== selectedId);
    setElements(next);
    pushHistory(next);
    setSelectedId(null);
  };

  const duplicateSelected = () => {
    const el = elements.find((e) => e.id === selectedId);
    if (!el) return;
    const dup = { ...el, id: genId(), x: el.x + 20, y: el.y + 20 };
    const next = [...elements, dup];
    setElements(next);
    pushHistory(next);
    setSelectedId(dup.id);
  };

  const moveLayer = (dir: 'up' | 'down') => {
    const idx = elements.findIndex((e) => e.id === selectedId);
    if (idx === -1) return;
    const next = [...elements];
    const target = dir === 'up' ? idx + 1 : idx - 1;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setElements(next);
    pushHistory(next);
  };

  // ── Add image ─────────────────────────────────────────
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const ext = file.name.split('.').pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('vision-images').upload(path, file);
    if (error) { console.error('Upload error:', error); return; }

    const { data: urlData } = supabase.storage.from('vision-images').getPublicUrl(path);
    const src = urlData.publicUrl;

    const img = new Image();
    img.onload = () => {
      const scale = Math.min(400 / img.width, 400 / img.height, 1);
      const boardRect = boardRef.current?.getBoundingClientRect();
      const newEl: CollageElement = {
        id: genId(),
        type: 'image',
        x: (boardRect ? boardRect.width / 2 : 400) - (img.width * scale) / 2,
        y: (boardRect ? boardRect.height / 2 : 300) - (img.height * scale) / 2,
        width: img.width * scale,
        height: img.height * scale,
        rotation: 0,
        src,
      };
      const next = [...elements, newEl];
      setElements(next);
      pushHistory(next);
      setSelectedId(newEl.id);
      setTool('select');
    };
    img.src = URL.createObjectURL(file);
    e.target.value = '';
  };

  // ── Add text ──────────────────────────────────────────
  const addText = () => {
    const boardRect = boardRef.current?.getBoundingClientRect();
    const newEl: CollageElement = {
      id: genId(),
      type: 'text',
      x: (boardRect ? boardRect.width / 2 : 400) - 125,
      y: (boardRect ? boardRect.height / 2 : 300) - 20,
      width: 250,
      height: 60,
      rotation: 0,
      text: 'Your dream here',
      fontSize: 28,
      fontFamily: 'Georgia, serif',
      fill: '#37352F',
    };
    const next = [...elements, newEl];
    setElements(next);
    pushHistory(next);
    setSelectedId(newEl.id);
    setTool('select');
  };

  // ── Drawing on canvas ────────────────────────────────
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool !== 'draw') return;
    setIsDrawing(true);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setDrawingPoints([x, y]);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || tool !== 'draw') return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setDrawingPoints((prev) => [...prev, x, y]);

    // Draw preview
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.beginPath();
    ctx.strokeStyle = '#37352F';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const pts = [...drawingPoints, x, y];
    for (let i = 0; i < pts.length; i += 2) {
      if (i === 0) ctx.moveTo(pts[i], pts[i + 1]);
      else ctx.lineTo(pts[i], pts[i + 1]);
    }
    ctx.stroke();
  };

  const handleCanvasMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    if (drawingPoints.length < 4) { setDrawingPoints([]); return; }

    // Compute bounding box
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let i = 0; i < drawingPoints.length; i += 2) {
      minX = Math.min(minX, drawingPoints[i]);
      minY = Math.min(minY, drawingPoints[i + 1]);
      maxX = Math.max(maxX, drawingPoints[i]);
      maxY = Math.max(maxY, drawingPoints[i + 1]);
    }
    const pad = 10;
    const w = maxX - minX + pad * 2;
    const h = maxY - minY + pad * 2;
    const normalizedPoints = drawingPoints.map((v, i) => i % 2 === 0 ? v - minX + pad : v - minY + pad);

    const newEl: CollageElement = {
      id: genId(),
      type: 'drawing',
      x: minX - pad,
      y: minY - pad,
      width: w,
      height: h,
      rotation: 0,
      points: normalizedPoints,
      stroke: '#37352F',
      strokeWidth: 3,
    };
    const next = [...elements, newEl];
    setElements(next);
    pushHistory(next);
    setDrawingPoints([]);
  };

  // ── Board click (deselect / place text) ───────────────
  const handleBoardClick = (e: React.MouseEvent) => {
    if (e.target === boardRef.current || e.target === canvasRef.current) {
      if (tool === 'text') {
        const rect = boardRef.current?.getBoundingClientRect();
        if (!rect) return;
        const newEl: CollageElement = {
          id: genId(),
          type: 'text',
          x: e.clientX - rect.left - 100,
          y: e.clientY - rect.top - 16,
          width: 200,
          height: 50,
          rotation: 0,
          text: 'Click to edit',
          fontSize: 24,
          fontFamily: 'Inter, sans-serif',
          fill: '#37352F',
        };
        const next = [...elements, newEl];
        setElements(next);
        pushHistory(next);
        setSelectedId(newEl.id);
        setTool('select');
      } else if (tool === 'select') {
        setSelectedId(null);
      }
    }
  };

  // ── Keyboard shortcuts ────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (document.activeElement instanceof HTMLTextAreaElement || document.activeElement instanceof HTMLInputElement) return;
      if (e.key === 'Delete' || e.key === 'Backspace') deleteSelected();
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') { e.preventDefault(); duplicateSelected(); }
      if (e.key === 'Escape') setSelectedId(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  // ── Canvas resize ─────────────────────────────────────
  useEffect(() => {
    const resize = () => {
      if (canvasRef.current && boardRef.current) {
        canvasRef.current.width = boardRef.current.offsetWidth;
        canvasRef.current.height = boardRef.current.offsetHeight;
      }
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const toolbarBtnClass = (active: boolean) =>
    `flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 ${
      active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
    }`;

  return (
    <AppShell>
      <div className="relative flex flex-col w-full h-[calc(100vh-64px)] bg-background overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/80 backdrop-blur-sm z-20">
          <div className="flex items-center gap-2">
            <button onClick={undo} disabled={historyIndex <= 0} className="p-2 rounded-lg hover:bg-secondary disabled:opacity-30 transition-colors" title="Undo">
              <Undo2 size={18} className="text-muted-foreground" />
            </button>
            <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-2 rounded-lg hover:bg-secondary disabled:opacity-30 transition-colors" title="Redo">
              <Redo2 size={18} className="text-muted-foreground" />
            </button>
          </div>

          {selectedId && (
            <div className="flex items-center gap-1">
              <button onClick={duplicateSelected} className="p-2 rounded-lg hover:bg-secondary transition-colors" title="Duplicate">
                <Copy size={16} className="text-muted-foreground" />
              </button>
              <button onClick={() => moveLayer('up')} className="p-2 rounded-lg hover:bg-secondary transition-colors" title="Bring forward">
                <ArrowUp size={16} className="text-muted-foreground" />
              </button>
              <button onClick={() => moveLayer('down')} className="p-2 rounded-lg hover:bg-secondary transition-colors" title="Send backward">
                <ArrowDown size={16} className="text-muted-foreground" />
              </button>
              <button onClick={deleteSelected} className="p-2 rounded-lg hover:bg-destructive/10 transition-colors" title="Delete">
                <Trash2 size={16} className="text-destructive" />
              </button>
            </div>
          )}

          <div className="text-xs text-muted-foreground font-light">
            {elements.length} element{elements.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Canvas area */}
        <div
          ref={boardRef}
          className="flex-1 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, hsl(40 7% 98%) 0%, hsl(40 10% 96%) 50%, hsl(30 15% 97%) 100%)',
            cursor: tool === 'draw' ? 'crosshair' : tool === 'text' ? 'text' : 'default',
          }}
          onClick={handleBoardClick}
        >
          {elements.length === 0 && !isDrawing && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="text-center">
                <p className="text-xl font-light text-muted-foreground" style={{ fontFamily: 'Georgia, serif' }}>
                  What does your future look like?
                </p>
                <p className="text-sm text-muted-foreground/60 mt-2">Add images, text, or doodle your dreams</p>
              </div>
            </div>
          )}

          {/* Elements */}
          {elements.map((el) => (
            <CollageItem
              key={el.id}
              el={el}
              isSelected={selectedId === el.id}
              onSelect={() => { setSelectedId(el.id); setTool('select'); }}
              onChange={(attrs) => updateElement(el.id, attrs)}
              boardRef={boardRef as React.RefObject<HTMLDivElement>}
            />
          ))}

          {/* Drawing canvas overlay */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 z-30"
            style={{ pointerEvents: tool === 'draw' ? 'auto' : 'none' }}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
          />
        </div>

        {/* Bottom toolbar */}
        <div className="flex items-center justify-center gap-1 px-4 py-3 border-t border-border bg-card/90 backdrop-blur-sm z-20">
          <button onClick={() => { setTool('select'); setSelectedId(null); }} className={toolbarBtnClass(tool === 'select')}>
            <MousePointer2 size={20} />
            <span className="text-[10px] font-medium">Select</span>
          </button>

          <button onClick={() => { setTool('draw'); setSelectedId(null); }} className={toolbarBtnClass(tool === 'draw')}>
            <Pencil size={20} />
            <span className="text-[10px] font-medium">Draw</span>
          </button>

          <button onClick={addText} className={toolbarBtnClass(false)}>
            <Type size={20} />
            <span className="text-[10px] font-medium">Text</span>
          </button>

          <button onClick={() => fileInputRef.current?.click()} className={toolbarBtnClass(false)}>
            <Plus size={20} />
            <span className="text-[10px] font-medium">Add Image</span>
          </button>

          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

          <button onClick={() => fileInputRef.current?.click()} className={toolbarBtnClass(false)}>
            <ImageIcon size={20} />
            <span className="text-[10px] font-medium">Photos</span>
          </button>

          <div className="relative">
            <button onClick={() => setShowMore(!showMore)} className={toolbarBtnClass(showMore)}>
              <MoreHorizontal size={20} />
              <span className="text-[10px] font-medium">More</span>
            </button>

            {showMore && (
              <div className="absolute bottom-full mb-2 right-0 bg-card border border-border rounded-xl shadow-lg p-2 min-w-[160px] z-50">
                <button onClick={() => { duplicateSelected(); setShowMore(false); }} disabled={!selectedId} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary rounded-lg transition-colors disabled:opacity-30">
                  <Copy size={14} /> Duplicate
                </button>
                <button onClick={() => { moveLayer('up'); setShowMore(false); }} disabled={!selectedId} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary rounded-lg transition-colors disabled:opacity-30">
                  <ArrowUp size={14} /> Bring Forward
                </button>
                <button onClick={() => { moveLayer('down'); setShowMore(false); }} disabled={!selectedId} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary rounded-lg transition-colors disabled:opacity-30">
                  <ArrowDown size={14} /> Send Backward
                </button>
                <button onClick={() => { deleteSelected(); setShowMore(false); }} disabled={!selectedId} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-30">
                  <Trash2 size={14} /> Delete
                </button>
                <hr className="my-1 border-border" />
                <button onClick={() => { setElements([]); pushHistory([]); setSelectedId(null); setShowMore(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                  <RotateCcw size={14} /> Clear Board
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default VisionRoom;
