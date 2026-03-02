
interface LogoProps {
    variant?: 'icon' | 'horizontal' | 'full'
    className?: string
    size?: number | string
}

export function Logo({ variant = 'horizontal', className = '', size }: LogoProps) {
    const iconOnly = variant === 'icon'
    const showText = variant === 'horizontal' || variant === 'full'
    const showClaim = variant === 'full'

    return (
        <div className={`flex items-center gap-3 ${className}`} style={size ? { height: size } : undefined}>
            <svg
                viewBox="0 0 100 100"
                className={iconOnly ? 'w-full h-full' : 'w-10 h-10'}
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#2DD4BF" /> {/* Teal/Green */}
                        <stop offset="50%" stopColor="#3B82F6" /> {/* Blue */}
                        <stop offset="100%" stopColor="#8B5CF6" /> {/* Violet */}
                    </linearGradient>
                </defs>

                {/* Medical Cross Base */}
                <path
                    d="M35 15C35 12.2386 37.2386 10 40 10H60C62.7614 10 65 12.2386 65 15V35H85C87.7614 35 90 37.2386 90 40V60C90 62.7614 87.7614 65 85 65H65V85C65 87.7614 62.7614 90 60 90H40C37.2386 90 35 87.7614 35 85V65H15C12.2386 65 10 62.7614 10 60V40C10 37.2386 12.2386 35 15 35H35V15Z"
                    fill="url(#logo-gradient)"
                />

                {/* Shield Overlay */}
                <path
                    d="M50 25C50 25 35 30 35 45C35 55 42 65 50 70C58 65 65 55 65 45C65 30 50 25 50 25Z"
                    fill="white"
                    fillOpacity="0.9"
                />

                {/* Checkmark */}
                <path
                    d="M42 48L47 53L58 42"
                    stroke="url(#logo-gradient)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>

            {showText && (
                <div className="flex flex-col leading-none">
                    <span className="text-2xl font-bold tracking-tight text-gray-900">
                        <span className="text-teal-500">Integral</span>
                        <span className="text-indigo-600">Salud</span>
                    </span>
                    {showClaim && (
                        <span className="text-[10px] font-medium text-gray-500 uppercase tracking-widest mt-1">
                            Plataforma de gestión integral
                        </span>
                    )}
                </div>
            )}
        </div>
    )
}
