export default function HeadingSmall({ title, description }: { title: string; description?: string }) {
    return (
        <div className="relative pl-5">
            {/* Decorative Gradient Bar */}
            <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-blue-400 to-purple-500 rounded-full shadow-lg animate-glow"></div>
            
            <header>
                {/* Title with improved styling */}
                <h3 className="text-xl font-bold text-white tracking-wide">
                    {title}
                </h3>
                
                {/* Description with a softer, more modern color */}
                {description && (
                    <p className="text-gray-400 text-sm mt-1">
                        {description}
                    </p>
                )}
            </header>

            {/* CSS for the glowing animation (optional, but adds a nice touch) */}
            <style jsx>{`
                @keyframes glow {
                    0% {
                        box-shadow: 0 0 3px rgba(59, 130, 246, 0.5), 0 0 5px rgba(139, 92, 246, 0.3);
                    }
                    50% {
                        box-shadow: 0 0 12px rgba(59, 130, 246, 0.8), 0 0 18px rgba(139, 92, 246, 0.5);
                    }
                    100% {
                        box-shadow: 0 0 3px rgba(59, 130, 246, 0.5), 0 0 5px rgba(139, 92, 246, 0.3);
                    }
                }
                .animate-glow {
                    animation: glow 2s infinite ease-in-out;
                }
            `}</style>
        </div>
    );
}