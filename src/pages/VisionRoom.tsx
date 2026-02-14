import { useState, useRef, useEffect } from 'react';
import { Pencil, Eraser, Type, Image as ImageIcon, Move, Undo, Plus, Save, Sparkles, Download } from 'lucide-react';
import AppShell from '@/components/AppShell';

interface DrawingElement {
  id: string;
  type: 'path' | 'text' | 'image';
  data: any;
  x: number;
  y: number;
}

interface VisionBoard {
  id: string;
  name: string;
  elements: DrawingElement[];
  createdAt: string;
  thumbnail?: string;
}

const VisionRoom = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState<'draw' | 'erase' | 'text' | 'image' | 'move'>('draw');
  const [elements, setElements] = useState<DrawingElement[]>([]);
  const [boards, setBoards] = useState<VisionBoard[]>([]);
  const [currentBoardId, setCurrentBoardId] = useState('board-1');
  const [showInspirationPanel, setShowInspirationPanel] = useState(false);
  const [showFirstDream, setShowFirstDream] = useState(true);
  const [imageSearchQuery, setImageSearchQuery] = useState('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  const [particles, setParticles] = useState<{ x: number; y: number; opacity: number }[]>([]);

  useEffect(() => {
    const particleCount = 15;
    const newParticles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      opacity: Math.random() * 0.3 + 0.1,
    }));
    setParticles(newParticles);

    const interval = setInterval(() => {
      setParticles(prev => prev.map(p => ({
        x: (p.x + Math.random() * 0.5 - 0.25) % 100,
        y: (p.y + Math.random() * 0.5 - 0.25) % 100,
        opacity: (p.opacity + Math.random() * 0.05 - 0.025) % 0.5,
      })));
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const tools = [
    { id: 'draw', icon: Pencil, label: 'Draw' },
    { id: 'erase', icon: Eraser, label: 'Erase' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'image', icon: ImageIcon, label: 'Image' },
    { id: 'move', icon: Move, label: 'Move' },
  ];

  const handleSaveAndNewBoard = () => {
    const currentBoard: VisionBoard = {
      id: currentBoardId,
      name: `Vision ${boards.length + 1}`,
      elements: elements,
      createdAt: new Date().toISOString(),
    };

    setBoards([...boards, currentBoard]);

    const newBoardId = `board-${Date.now()}`;
    setCurrentBoardId(newBoardId);
    setElements([]);
    setShowFirstDream(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        setUploadedImages([...uploadedImages, imageUrl]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePlaceFirstDream = () => {
    setShowFirstDream(false);
    setCurrentTool('draw');
  };

  return (
    <AppShell>
      <div className="relative w-full h-[calc(100vh-64px)] overflow-hidden" style={{ background: 'linear-gradient(135deg, #FAF8F5 0%, #F5F0EB 50%, #FFF8F0 100%)' }}>

        {/* Floating particles */}
        {particles.map((particle, idx) => (
          <div
            key={idx}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: '4px',
              height: '4px',
              backgroundColor: `rgba(217, 179, 140, ${particle.opacity})`,
              transition: 'all 2s ease-in-out',
            }}
          />
        ))}

        {/* Paper texture overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.02\'/%3E%3C/svg%3E")', opacity: 0.3 }} />

        {/* Left toolbar */}
        <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 z-10">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isActive = currentTool === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => setCurrentTool(tool.id as any)}
                className={`group relative w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-amber-100/40 backdrop-blur-sm'
                    : 'hover:bg-white/30 opacity-40 hover:opacity-100'
                }`}
                title={tool.label}
              >
                <Icon size={20} className={isActive ? 'text-amber-700' : 'text-gray-500'} />
                <span className="absolute left-14 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-xs text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-sm">
                  {tool.label}
                </span>
              </button>
            );
          })}

          <button className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-white/30 opacity-40 hover:opacity-100 transition-all duration-300" title="Undo">
            <Undo size={20} className="text-gray-500" />
          </button>

          <button
            onClick={() => setShowInspirationPanel(!showInspirationPanel)}
            className="mt-8 w-12 h-12 flex items-center justify-center rounded-xl bg-amber-100/40 backdrop-blur-sm hover:bg-amber-200/40 transition-all duration-300 group"
            title="Add inspiration"
          >
            <Sparkles size={20} className="text-amber-600" />
            <span className="absolute left-14 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-xs text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-sm">
              Add inspiration
            </span>
          </button>
        </div>

        {/* Main canvas */}
        <div className="absolute inset-0 flex items-center justify-center">
          <canvas
            ref={canvasRef}
            className="w-full h-full cursor-crosshair"
            onMouseDown={() => setIsDrawing(true)}
            onMouseUp={() => setIsDrawing(false)}
            onMouseLeave={() => setIsDrawing(false)}
          />

          {showFirstDream && elements.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center animate-fade-in">
              <div className="text-center max-w-md">
                <div className="mb-8">
                  <p className="text-2xl font-light text-gray-700 tracking-tight" style={{ fontFamily: "'Georgia', serif" }}>
                    What does your future feel like?
                  </p>
                  <p className="text-sm text-gray-400 mt-3 font-light">
                    You can draw, write, or add images.
                  </p>
                </div>

                <button
                  onClick={handlePlaceFirstDream}
                  className="px-6 py-3 bg-amber-50/80 backdrop-blur-sm border border-amber-200/50 rounded-full text-sm text-amber-700 font-light hover:bg-amber-100/80 transition-all duration-300 hover:shadow-sm"
                >
                  Place your first dream
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Top right - Save & new board */}
        <div className="absolute top-6 right-6 flex items-center gap-4 z-10">
          {boards.length > 0 && (
            <div className="flex items-center gap-3 bg-white/40 backdrop-blur-sm rounded-full px-4 py-2">
              <div className="flex -space-x-2">
                {boards.slice(-3).map((board, idx) => (
                  <div
                    key={board.id}
                    className="w-8 h-8 rounded-lg border-2 border-white/80 bg-gradient-to-br from-amber-100 to-orange-50 shadow-sm"
                    style={{ zIndex: 3 - idx }}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500 font-light">
                {boards.length} {boards.length === 1 ? 'vision' : 'visions'}
              </span>
            </div>
          )}

          <button
            onClick={handleSaveAndNewBoard}
            className="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-full text-sm text-gray-600 hover:bg-white/80 transition-all duration-300 font-light"
          >
            <Plus size={16} />
            Save & start a new board
          </button>
        </div>

        {/* Inspiration panel */}
        <div
          className="absolute right-0 top-0 h-full w-80 transition-transform duration-500 ease-out z-20"
          style={{ transform: showInspirationPanel ? 'translateX(0)' : 'translateX(100%)' }}
        >
          <div className="h-full bg-white/80 backdrop-blur-xl border-l border-gray-200/30 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-light text-gray-700">Inspiration</h3>
              <button
                onClick={() => setShowInspirationPanel(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-xs text-gray-400 font-light mb-2 block">Search images</label>
                <input
                  type="text"
                  value={imageSearchQuery}
                  onChange={(e) => setImageSearchQuery(e.target.value)}
                  placeholder="mountains, dreams, peace..."
                  className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-300 transition-colors font-light"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 font-light mb-2 block">Upload image</label>
                <label className="flex items-center gap-3 px-4 py-3 bg-gray-50/50 border border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-amber-300 transition-colors">
                  <ImageIcon size={18} className="text-gray-400" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  <span className="text-sm text-gray-400 font-light">Choose an image</span>
                </label>
              </div>

              {uploadedImages.length > 0 && (
                <div>
                  <label className="text-xs text-gray-400 font-light mb-2 block">Recent uploads</label>
                  <div className="grid grid-cols-2 gap-2">
                    {uploadedImages.map((img, idx) => (
                      <div key={idx} className="aspect-square rounded-lg overflow-hidden border border-gray-200/50 cursor-pointer hover:border-amber-300 transition-colors">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <style>{`
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            animation: fade-in 0.6s ease-out;
          }
        `}</style>
      </div>
    </AppShell>
  );
};

export default VisionRoom;
