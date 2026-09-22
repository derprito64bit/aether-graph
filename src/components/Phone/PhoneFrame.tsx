import { FINISHES, type FinishId } from '../../data/product.ts'
import { cn } from '../../lib/cn.ts'

interface PhoneFrameProps {
  finish?: FinishId
  face?: 'front' | 'rear'
  label?: string
}

/**
 * Static CSS phone renderer for WebGL failure, context loss, and no-JS.
 * Covers front and rear views so every act has a fallback.
 */
export function PhoneFrame({ finish = 'obsidian', face = 'front', label }: PhoneFrameProps) {
  const meta = FINISHES.find((f) => f.id === finish) ?? FINISHES[0]
  return (
    <div
      role="img"
      aria-label={label ?? `Aether One X in ${meta?.name}, ${face} view (static fallback)`}
      className={cn('phone-frame', face === 'rear' && 'phone-frame--rear')}
      data-finish={finish}
      data-face={face}
    >
      {face === 'front' ? (
        <div className="phone-frame-screen">
          <div className="phone-frame-notch" />
          <div className="phone-frame-wallpaper" />
        </div>
      ) : (
        <div className="phone-frame-back">
          <div className="phone-frame-island">
            <span className="phone-frame-lens phone-frame-lens-a" />
            <span className="phone-frame-lens phone-frame-lens-b" />
            <span className="phone-frame-lens phone-frame-lens-c" />
            <span className="phone-frame-periscope" />
            <span className="phone-frame-medallion" />
          </div>
          <p className="phone-frame-logo">AETHER</p>
        </div>
      )}
      <style>{`
        .phone-frame { width: 180px; height: 372px; border-radius: 30px; padding: 10px;
          background: ${meta?.swatch ?? '#0b0b0e'}; border: 1px solid rgba(255,255,255,0.16);
          box-shadow: 0 30px 80px rgba(0,0,0,0.55); }
        .phone-frame-screen { position: relative; width: 100%; height: 100%; border-radius: 22px;
          overflow: hidden; background: #04060c; }
        .phone-frame-notch { position: absolute; top: 10px; left: 50%; width: 64px; height: 8px;
          border-radius: 999px; transform: translateX(-50%); background: #000; }
        .phone-frame-wallpaper { position: absolute; inset: 0;
          background: radial-gradient(120px 200px at 70% 20%, rgba(127,180,255,0.55), transparent 70%),
            linear-gradient(180deg, #0d1c33, #0a1220); }
        .phone-frame-back { position: relative; width: 100%; height: 100%; border-radius: 22px;
          background: ${meta?.swatch ?? '#0b0b0e'}; }
        /* Circular module, centered: knurled collar, triangle lenses,
           periscope window below, iris medallion at the centre. */
        .phone-frame-island { position: absolute; top: 10px; left: 50%; width: 104px; height: 104px;
          transform: translateX(-50%); border-radius: 999px;
          background: radial-gradient(circle at 35% 30%, rgba(70,80,95,0.9), rgba(0,0,0,0.55) 70%);
          border: 2px solid rgba(200,215,235,0.35);
          box-shadow: 0 0 0 3px rgba(0,0,0,0.4), inset 0 0 0 5px rgba(255,255,255,0.05); }
        .phone-frame-lens { position: absolute; border-radius: 999px;
          background: radial-gradient(circle at 35% 35%, #33507e, #060a12 70%);
          border: 2px solid rgba(200,215,235,0.5); }
        .phone-frame-lens-a { left: 39px; top: 8px; width: 26px; height: 26px; }
        .phone-frame-lens-b { left: 14px; bottom: 16px; width: 21px; height: 21px; }
        .phone-frame-lens-c { right: 14px; bottom: 16px; width: 21px; height: 21px; }
        .phone-frame-periscope { position: absolute; left: 34px; bottom: 6px; width: 36px; height: 12px;
          border-radius: 6px; background: #0a0e16; border: 1px solid rgba(200,215,235,0.35); }
        .phone-frame-medallion { position: absolute; left: 45px; top: 45px; width: 14px; height: 14px;
          border-radius: 999px; background: radial-gradient(circle, #dfe6f0 30%, #6a7688 75%);
          border: 1px solid rgba(255,255,255,0.5); }
        .phone-frame-logo { position: absolute; bottom: 60px; width: 100%; text-align: center;
          font-size: 10px; letter-spacing: 0.5em; color: rgba(240,245,252,0.8); }
      `}</style>
    </div>
  )
}
