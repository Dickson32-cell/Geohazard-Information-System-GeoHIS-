export default function LiquidGlassText() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '30px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2px 8px',
      borderRadius: '5px',
      minWidth: '140px',
      maxWidth: '180px',
      overflow: 'hidden'
    }}>
      <div style={{
        fontSize: '10px',
        color: 'white',
        textAlign: 'center',
        fontWeight: '600',
        whiteSpace: 'nowrap',
        animation: 'scrollText 10s linear infinite'
      }}>
        Designed by Abdul Rashid Dickson
      </div>
      <style jsx>{`
        @keyframes scrollText {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </div>
  );
}