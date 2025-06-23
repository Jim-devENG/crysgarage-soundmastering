export default function Logo({ size = 48 }: { size?: number }) {
  return (
    <div className="flex flex-col items-center mb-4">
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="24" width="4" height="16" rx="2" fill="#a78bfa"/>
        <rect x="16" y="16" width="4" height="32" rx="2" fill="#c4b5fd"/>
        <rect x="24" y="8" width="4" height="48" rx="2" fill="#a78bfa"/>
        <rect x="32" y="0" width="4" height="64" rx="2" fill="#f472b6"/>
        <rect x="40" y="8" width="4" height="48" rx="2" fill="#a78bfa"/>
        <rect x="48" y="16" width="4" height="32" rx="2" fill="#c4b5fd"/>
        <rect x="56" y="24" width="4" height="16" rx="2" fill="#a78bfa"/>
      </svg>
      <span className="text-3xl font-extrabold text-white tracking-tight mt-2 drop-shadow-lg">
        Crysgarage
      </span>
    </div>
  )
} 