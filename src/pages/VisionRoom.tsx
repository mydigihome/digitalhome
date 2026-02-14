import { useState, useRef, useEffect, useCallback } from 'react';
import { Pencil, Type, Plus, ImageIcon, LayoutGrid, Trash2, Copy, ArrowUp, ArrowDown, RotateCcw, Undo2, Redo2, MousePointer2, Save, Eraser, Palette, Loader2 } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

interface SavedBoard {
  id: string;
  name: string;
  elements: CollageElement[];
  created_at: string;
}

const genId = () => `el-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const RAINBOW_COLORS = [
  '#37352F', '#787774', '#FFFFFF',
  '#E03E3E', '#FF6B6B', '#D44B1A',
  '#FFB224', '#FFDD57', '#0F7B6C',
  '#4CAF50', '#529CCA', '#2196F3',
  '#8B5CF6', '#6D28D9', '#D946EF',
  '#EC4899', '#F472B6',
];

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
          crossOrigin="anonymous"
          style={{ boxShadow: isSelected ? '0 0 0 2px hsl(var(--primary))' : '0 2px 8px rgba(0,0,0,0.1)' }}
        />
      )}

      {el.type === 'text' && !isEditing && (
        <div
          className="w-full h-full flex items-center justify-center p-2 select-none"
          style={{
            fontSize: el.fontSize || 24,
            fontFamily: el.fontFamily || 'Georgia, serif',
            color: el.fill || 'hsl(var(--foreground))',
            outline: isSelected ? '2px solid hsl(var(--primary))' : 'none',
            borderRadius: 8,
            background: isSelected ? 'hsl(var(--primary) / 0.05)' : 'transparent',
            textShadow: el.fill === '#FFFFFF' ? '0 1px 3px rgba(0,0,0,0.5)' : 'none',
          }}
        >
          {el.text || 'Double-click to edit'}
        </div>
      )}

      {el.type === 'text' && isEditing && (
        <textarea
          autoFocus
          defaultValue={el.text || ''}
          className="w-full h-full p-2 resize-none border-2 rounded-lg outline-none"
          style={{
            fontSize: el.fontSize || 24,
            fontFamily: el.fontFamily || 'Georgia, serif',
            color: el.fill || 'hsl(var(--foreground))',
            borderColor: 'hsl(var(--primary))',
            background: 'hsl(var(--card))',
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
            stroke={el.stroke || 'hsl(var(--foreground))'}
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
              className="absolute w-3.5 h-3.5 bg-card border-2 border-primary rounded-full z-50"
              style={{
                top: corner.includes('top') ? -7 : undefined,
                bottom: corner.includes('bottom') ? -7 : undefined,
                left: corner.includes('left') ? -7 : undefined,
                right: corner.includes('right') ? -7 : undefined,
                cursor: corner === 'top-left' || corner === 'bottom-right' ? 'nwse-resize' : 'nesw-resize',
              }}
              onMouseDown={(e) => handleResizeStart(e, corner)}
            />
          ))}

          {/* Rotate handle */}
          <div
            className="absolute -top-8 left-1/2 -translate-x-1/2 w-5 h-5 bg-card border-2 border-primary rounded-full flex items-center justify-center z-50 cursor-grab"
            onMouseDown={handleRotateStart}
          >
            <RotateCcw size={10} className="text-primary" />
          </div>
          <div className="absolute -top-4 left-1/2 w-px h-4 bg-primary z-40" />
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
  const [boardId, setBoardId] = useState<string | null>(null);
  const [savedBoards, setSavedBoards] = useState<SavedBoard[]>([]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [showBoards, setShowBoards] = useState(false);
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

  // ── Load boards ────────────────────────────────────────
  const loadBoards = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('vision_boards')
      .select('*')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false });
    if (data) setSavedBoards(data as any);
  }, [user]);

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
      loadBoards();
    })();
  }, [user]);

  // ── Save & Start New Board ────────────────────────────
  const saveAndNewBoard = async () => {
    if (!user) return;
    // Force save current board immediately
    if (boardId && elements.length > 0) {
      await supabase
        .from('vision_boards')
        .update({ elements: elements as any, updated_at: new Date().toISOString() })
        .eq('id', boardId);
    }
    // Create new blank board
    const { data } = await supabase
      .from('vision_boards')
      .insert({
        user_id: user.id,
        name: `Vision ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
        elements: [] as any,
      })
      .select('id')
      .single();
    if (data) {
      setBoardId(data.id);
      setElements([]);
      setHistory([[]]);
      setHistoryIndex(0);
      setSelectedId(null);
      toast.success('Board saved! Starting fresh canvas.');
      loadBoards();
    }
  };

  // ── Load a specific board ──────────────────────────────
  const loadBoard = (board: SavedBoard) => {
    setBoardId(board.id);
    setElements(board.elements || []);
    setHistory([board.elements || []]);
    setHistoryIndex(0);
    setSelectedId(null);
    setShowBoards(false);
    toast.success(`Loaded "${board.name}"`);
  };

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
    if (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
      return;
    }

    // Use signed URL since bucket is private
    const { data: signedData } = await supabase.storage
      .from('vision-images')
      .createSignedUrl(path, 60 * 60 * 24 * 365); // 1 year

    const src = signedData?.signedUrl;
    if (!src) {
      toast.error('Failed to get image URL');
      return;
    }

    // Also use local blob for immediate display + sizing
    const localUrl = URL.createObjectURL(file);
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
      toast.success('Image added!');
      URL.revokeObjectURL(localUrl);
    };
    img.src = localUrl;
    e.target.value = '';
  };

  // ── Remove Background ────────────────────────────────
  const removeBackground = async () => {
    const el = elements.find((e) => e.id === selectedId);
    if (!el || el.type !== 'image' || !el.src) return;

    setIsRemovingBg(true);
    try {
      const { removeBackground: removeBg } = await import('@imgly/background-removal');
      const blob = await removeBg(el.src, {
        output: { format: 'image/png', quality: 0.9 },
      });

      // Upload processed image
      if (!user) return;
      const path = `${user.id}/nobg-${Date.now()}.png`;
      const file = new File([blob], 'nobg.png', { type: 'image/png' });
      const { error } = await supabase.storage.from('vision-images').upload(path, file);
      if (error) throw error;

      const { data: signedData } = await supabase.storage
        .from('vision-images')
        .createSignedUrl(path, 60 * 60 * 24 * 365);

      if (signedData?.signedUrl) {
        updateElement(el.id, { src: signedData.signedUrl });
        toast.success('Background removed!');
      }
    } catch (err) {
      console.error('Remove bg error:', err);
      toast.error('Failed to remove background. Try a different image.');
    } finally {
      setIsRemovingBg(false);
    }
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
    setDrawingPoints([e.clientX - rect.left, e.clientY - rect.top]);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || tool !== 'draw') return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setDrawingPoints((prev) => [...prev, x, y]);

    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.beginPath();
    ctx.strokeStyle = 'hsl(30 15% 20%)';
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

  // ── Board click ───────────────────────────────────────
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
        setShowColorPicker(false);
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
      if (e.key === 'Escape') { setSelectedId(null); setShowColorPicker(false); }
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

  const selectedEl = elements.find((e) => e.id === selectedId);

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
            <div className="w-px h-5 bg-border mx-1" />
            <button onClick={saveAndNewBoard} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors" title="Save & New Board">
              <Save size={14} />
              <span className="hidden sm:inline">Save & New</span>
            </button>
            <div className="relative">
              <button onClick={() => { setShowBoards(!showBoards); loadBoards(); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-secondary transition-colors text-muted-foreground">
                <LayoutGrid size={14} />
                <span className="hidden sm:inline">Boards</span>
              </button>
              {showBoards && (
                <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-xl shadow-lg p-2 min-w-[220px] max-h-[300px] overflow-y-auto z-50">
                  {savedBoards.length === 0 && (
                    <p className="text-xs text-muted-foreground p-2">No saved boards yet</p>
                  )}
                  {savedBoards.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => loadBoard(b)}
                      className={`w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-secondary transition-colors ${b.id === boardId ? 'bg-primary/10 text-primary' : 'text-foreground'}`}
                    >
                      <div className="font-medium truncate">{b.name}</div>
                      <div className="text-xs text-muted-foreground">{new Date(b.created_at).toLocaleDateString()}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Context actions for selected element */}
          {selectedId && (
            <div className="flex items-center gap-1">
              {selectedEl?.type === 'image' && (
                <button
                  onClick={removeBackground}
                  disabled={isRemovingBg}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-accent text-accent-foreground hover:bg-accent/80 transition-colors disabled:opacity-50"
                  title="Remove Background"
                >
                  {isRemovingBg ? <Loader2 size={14} className="animate-spin" /> : <Eraser size={14} />}
                  <span className="hidden sm:inline">{isRemovingBg ? 'Removing...' : 'Remove BG'}</span>
                </button>
              )}
              {selectedEl?.type === 'text' && (
                <div className="relative">
                  <button
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className="p-2 rounded-lg hover:bg-secondary transition-colors"
                    title="Text Color"
                  >
                    <Palette size={16} style={{ color: selectedEl.fill || 'hsl(var(--foreground))' }} />
                  </button>
                  {showColorPicker && (
                    <div className="absolute top-full right-0 mt-1 bg-card border border-border rounded-xl shadow-lg p-3 z-50">
                      <div className="grid grid-cols-6 gap-1.5 w-[180px]">
                        {RAINBOW_COLORS.map((color) => (
                          <button
                            key={color}
                            onClick={() => { updateElement(selectedId, { fill: color }); }}
                            className="w-6 h-6 rounded-full border border-border hover:scale-110 transition-transform"
                            style={{
                              backgroundColor: color,
                              outline: selectedEl.fill === color ? '2px solid hsl(var(--primary))' : 'none',
                              outlineOffset: 2,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
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
            background: 'linear-gradient(135deg, hsl(var(--background)) 0%, hsl(40 10% 96%) 50%, hsl(30 15% 97%) 100%)',
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

          <button
            onClick={() => {
              // Layouts: add a grid of placeholder images
              const boardRect = boardRef.current?.getBoundingClientRect();
              const w = boardRect ? boardRect.width : 800;
              const h = boardRect ? boardRect.height : 600;
              const gap = 12;
              const cols = 3;
              const rows = 2;
              const cellW = (w - gap * (cols + 1)) / cols;
              const cellH = (h - gap * (rows + 1)) / rows;
              const newEls: CollageElement[] = [];
              for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                  newEls.push({
                    id: genId(),
                    type: 'text',
                    x: gap + c * (cellW + gap),
                    y: gap + r * (cellH + gap),
                    width: cellW,
                    height: cellH,
                    rotation: 0,
                    text: `+`,
                    fontSize: 40,
                    fontFamily: 'Inter, sans-serif',
                    fill: '#787774',
                  });
                }
              }
              const next = [...elements, ...newEls];
              setElements(next);
              pushHistory(next);
              toast.success('Grid layout added! Replace placeholders with images.');
            }}
            className={toolbarBtnClass(false)}
          >
            <LayoutGrid size={20} />
            <span className="text-[10px] font-medium">Layouts</span>
          </button>
        </div>
      </div>
    </AppShell>
  );
};

export default VisionRoom;
