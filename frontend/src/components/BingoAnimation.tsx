import React from 'react';
import { BINGO_LETTERS } from '../shared-adapter';

interface BingoAnimationProps {
  isVisible: boolean;
  isComplete: boolean;
  markedLetters: boolean[];
}

const BingoAnimation: React.FC<BingoAnimationProps> = ({
  isVisible,
  isComplete,
  markedLetters
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ minHeight: '100dvh' }}>
      {/* Debug info for mobile testing
      <div className="absolute top-4 left-4 bg-black/50 text-white p-2 rounded text-xs z-50 sm:hidden">
        Mobile Animation Active
      </div> */}
      
      {/* Multi-layered dynamic background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/98 via-gray-900/96 to-slate-950/98" />
      <div className="absolute inset-0 bg-gradient-to-tr from-teal-500/10 via-purple-500/5 to-yellow-500/10" />
      <div className="absolute inset-0 backdrop-blur-xl" />
      
      {/* Enhanced animated background particles system */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating ambient particles - responsive amount */}
        {[...Array(20)].map((_, i) => (
          <div
            key={`ambient-${i}`}
            className={`absolute rounded-full ${i >= 10 ? 'hidden sm:block' : ''}`}
            style={{
              width: `${1 + Math.random() * 3}px`,
              height: `${1 + Math.random() * 3}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: `hsl(${180 + Math.random() * 60}, ${70 + Math.random() * 30}%, ${50 + Math.random() * 30}%)`,
              animation: `enhancedFloat 8s ${Math.random() * 4}s infinite ease-in-out`,
              opacity: 0.4 + Math.random() * 0.3
            }}
          />
        ))}
        
        {/* Shooting stars - responsive amount */}
        {[...Array(6)].map((_, i) => (
          <div
            key={`star-${i}`}
            className={`absolute w-2 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent ${i >= 3 ? 'hidden sm:block' : ''}`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `shootingStar 4s ${i * 0.5}s infinite linear`,
              transform: 'rotate(45deg)'
            }}
          />
        ))}
        
        {/* Energy waves - responsive amount */}
        {[...Array(4)].map((_, i) => (
          <div
            key={`wave-${i}`}
            className={`absolute inset-0 border border-teal-400/10 rounded-full ${i >= 2 ? 'hidden sm:block' : ''}`}
            style={{
              animation: `energyWave 6s ${i * 1.2}s infinite ease-out`
            }}
          />
        ))}
      </div>
      
      {/* Main content container with enhanced responsiveness */}
      <div className="relative h-full flex flex-col items-center justify-center px-2 sm:px-4 md:px-8 overflow-hidden">
        {/* BINGO Letters Container with enhanced styling */}
        <div className="relative mb-6 sm:mb-8 md:mb-16">
          {/* Multi-layer progress backdrop with pulsing effect */}
          <div className="absolute -inset-4 sm:-inset-8 md:-inset-12 bg-gradient-radial from-teal-500/30 via-purple-500/20 to-transparent rounded-full blur-3xl" 
               style={{ 
                 transform: `scale(${isComplete ? 1.2 : 0.8})`,
                 transition: 'transform 3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                 animation: isComplete ? 'victoryPulse 2s ease-in-out infinite' : 'none'
               }} />
          
          {/* Enhanced Letters grid with dynamic spacing */}
          <div className="flex items-center justify-center gap-1 sm:gap-3 md:gap-6 lg:gap-8 relative">
            {BINGO_LETTERS.map((letter: string, idx: number) => (
              <div key={letter} className="relative group">
                {/* Letter container with advanced glassmorphism and magnetic hover */}
                <div className={`
                  relative w-12 h-12 sm:w-20 sm:h-20 md:w-28 md:h-28 lg:w-32 lg:h-32 flex items-center justify-center
                  bg-gradient-to-br from-slate-800/70 to-slate-900/50
                  backdrop-blur-xl border-2 
                  rounded-xl sm:rounded-2xl md:rounded-3xl shadow-2xl
                  transition-all duration-700 ease-out
                  group-hover:scale-110 group-hover:rotate-3
                  ${markedLetters[idx] ? 
                    'border-teal-400/60 shadow-teal-400/40 bg-gradient-to-br from-teal-900/40 to-emerald-900/30' : 
                    'border-white/20 shadow-slate-900/60'
                  }
                `} style={{
                  animation: `enhancedLetterEntrance 1.2s ${idx * 0.2}s cubic-bezier(0.34, 1.56, 0.64, 1) both`,
                  boxShadow: markedLetters[idx] ? 
                    `0 0 40px rgba(20, 184, 166, 0.6), 0 25px 50px rgba(0, 0, 0, 0.4), inset 0 0 20px rgba(20, 184, 166, 0.1)` : 
                    '0 15px 40px rgba(0, 0, 0, 0.4), inset 0 0 10px rgba(255, 255, 255, 0.05)'
                }}>
                  
                  {/* Letter with enhanced gradient and animation */}
                  <span className={`
                    text-xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-wider
                    transition-all duration-700 ease-out
                    ${markedLetters[idx] ? 
                      'bg-gradient-to-br from-teal-200 via-teal-400 to-emerald-500 bg-clip-text text-transparent animate-pulse' : 
                      'bg-gradient-to-br from-gray-200 via-gray-300 to-gray-500 bg-clip-text text-transparent'
                    }
                  `} style={{
                    textShadow: markedLetters[idx] ? 
                      '0 0 30px rgba(20, 184, 166, 0.8), 0 0 60px rgba(20, 184, 166, 0.4)' : 
                      '0 0 15px rgba(156, 163, 175, 0.4)',
                    filter: markedLetters[idx] ? 
                      'drop-shadow(0 0 25px rgba(20, 184, 166, 0.6)) brightness(1.1)' : 
                      'brightness(0.9)',
                    animation: markedLetters[idx] ? 'letterGlow 2s ease-in-out infinite alternate' : 'none'
                  }}>
                    {letter}
                  </span>
                  
                  {/* Enhanced strike-through with multiple effects */}
                  {markedLetters[idx] && (
                    <>
                      {/* Main strike line */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 sm:w-16 md:w-20 lg:w-24 h-1 sm:h-1.5 bg-gradient-to-r from-teal-300 via-teal-400 to-teal-500 rounded-full shadow-2xl shadow-teal-400/80"
                             style={{ 
                               animation: 'enhancedStrikeGrow 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                               transform: 'rotate(45deg)'
                             }} />
                      </div>
                      
                      {/* Strike glow effect */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 sm:w-20 md:w-24 lg:w-28 h-2 sm:h-3 bg-gradient-to-r from-transparent via-teal-400/50 to-transparent rounded-full blur-sm"
                             style={{ 
                               transform: 'rotate(45deg)',
                               animation: 'strikeGlow 2s ease-in-out infinite'
                             }} />
                      </div>
                    </>
                  )}
                  
                  {/* Enhanced shimmer overlay */}
                  {markedLetters[idx] && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-xl sm:rounded-2xl md:rounded-3xl"
                         style={{ animation: 'enhancedShimmer 3s infinite ease-in-out' }} />
                  )}
                  
                  {/* Magnetic field effect for marked letters */}
                  {markedLetters[idx] && (
                    <div className="absolute inset-0 rounded-xl sm:rounded-2xl md:rounded-3xl border-2 border-teal-400/30"
                         style={{ animation: 'magneticField 4s ease-in-out infinite' }} />
                  )}
                </div>
                
                {/* Enhanced particle system for marked letters */}
                {markedLetters[idx] && (
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Primary floating particles - fewer on mobile */}
                    {[...Array(6)].map((_, i) => (
                      <div
                        key={`primary-${i}`}
                        className={`absolute w-2 sm:w-3 h-2 sm:h-3 rounded-full ${i >= 3 ? 'hidden sm:block' : ''}`}
                        style={{
                          left: '50%',
                          top: '50%',
                          background: `linear-gradient(45deg, hsl(${180 + i * 15}, 70%, 60%), hsl(${200 + i * 10}, 80%, 70%))`,
                          animation: `enhancedFloatParticle${i % 4} 4s ${i * 0.15}s infinite ease-in-out`,
                          filter: 'drop-shadow(0 0 8px rgba(20, 184, 166, 0.6))'
                        }}
                      />
                    ))}
                    
                    {/* Secondary sparkle particles - fewer on mobile */}
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={`sparkle-${i}`}
                        className={`absolute w-1 h-1 bg-white rounded-full ${i >= 4 ? 'hidden sm:block' : ''}`}
                        style={{
                          left: '50%',
                          top: '50%',
                          animation: `sparkleEffect${i % 3} 2s ${i * 0.1}s infinite ease-out`,
                          opacity: 0.8
                        }}
                      />
                    ))}
                    
                    {/* Energy rings - fewer on mobile */}
                    {[...Array(2)].map((_, i) => (
                      <div
                        key={`ring-${i}`}
                        className={`absolute inset-0 border border-teal-400/20 rounded-xl sm:rounded-2xl md:rounded-3xl ${i >= 1 ? 'hidden sm:block' : ''}`}
                        style={{
                          animation: `energyRing 3s ${i * 0.5}s infinite ease-out`
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Enhanced BINGO! Completion Text with spectacular effects */}
        {isComplete && (
          <div className="text-center space-y-4 sm:space-y-8 px-4 relative" style={{ animation: 'spectacularEntrance 2s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
            
            {/* Main BINGO text with multiple effects */}
            <div className="relative">
              {/* Background glow layers */}
              <div className="absolute inset-0 text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-wider text-teal-400/20 blur-3xl scale-110">
                BINGO!
              </div>
              <div className="absolute inset-0 text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-wider text-teal-400/40 blur-xl">
                BINGO!
              </div>
              
              {/* Main text with prismatic effect */}
              <h1 className="relative text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-wider bg-gradient-to-r from-teal-200 via-emerald-400 to-yellow-300 bg-clip-text text-transparent"
                  style={{ 
                    textShadow: '0 0 60px rgba(20, 184, 166, 0.8), 0 0 120px rgba(20, 184, 166, 0.4)',
                    filter: 'drop-shadow(0 0 40px rgba(20, 184, 166, 0.8)) brightness(1.2)',
                    animation: 'prismEffect 4s ease-in-out infinite, textFloat 6s ease-in-out infinite'
                  }}>
                BINGO!
              </h1>
              
              {/* Reflective surface effect */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-wider bg-gradient-to-t from-teal-400/30 to-transparent bg-clip-text text-transparent"
                   style={{ 
                     transform: 'translateX(-50%) scaleY(-0.5) translateY(10px)',
                     filter: 'blur(2px)',
                     opacity: 0.3
                   }}>
                BINGO!
              </div>
            </div>
            
            {/* Enhanced subtitle with typewriter effect */}
            <div className="space-y-2 sm:space-y-3">
              <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-white font-bold tracking-wide"
                 style={{ animation: 'typewriterEffect 1s ease-out 1s both' }}>
                🎉 VICTORY ACHIEVED! 🎉
              </p>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-emerald-300 font-medium tracking-wide"
                 style={{ animation: 'typewriterEffect 1s ease-out 2s both' }}>
                Line completed successfully!
              </p>
            </div>
            
            {/* Spectacular celebration effects */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {/* Confetti burst - responsive amount */}
              {[...Array(30)].map((_, i) => (
                <div
                  key={`confetti-${i}`}
                  className={`absolute w-2 h-4 sm:w-3 sm:h-6 ${i >= 15 ? 'hidden sm:block' : ''}`}
                  style={{
                    left: '50%',
                    top: '50%',
                    background: `hsl(${Math.random() * 360}, 80%, 60%)`,
                    borderRadius: '2px',
                    animation: `confettiBurst${i % 8} 6s ${i * 0.05}s ease-out`,
                    transform: `rotate(${Math.random() * 360}deg)`
                  }}
                />
              ))}
              
              {/* Firework sparkles - responsive amount */}
              {[...Array(20)].map((_, i) => (
                <div
                  key={`firework-${i}`}
                  className={`absolute w-1 h-1 bg-white rounded-full ${i >= 10 ? 'hidden sm:block' : ''}`}
                  style={{
                    left: `${20 + Math.random() * 60}%`,
                    top: `${20 + Math.random() * 60}%`,
                    animation: `fireworkSparkle 3s ${i * 0.1}s infinite ease-out`,
                    boxShadow: '0 0 10px rgba(255, 255, 255, 0.8)'
                  }}
                />
              ))}
              
              {/* Energy waves from center - responsive amount */}
              {[...Array(4)].map((_, i) => (
                <div
                  key={`energy-${i}`}
                  className={`absolute inset-0 border-2 border-teal-400/20 rounded-full ${i >= 2 ? 'hidden sm:block' : ''}`}
                  style={{
                    left: '50%',
                    top: '50%',
                    animation: `energyWaveExpand 4s ${i * 0.3}s infinite ease-out`
                  }}
                />
              ))}
              
              {/* Floating text particles */}
              {['AMAZING!', 'PERFECT!', 'BRILLIANT!', 'EXCELLENT!'].map((text, i) => (
                <div
                  key={`text-${i}`}
                  className="absolute text-sm sm:text-base font-bold text-yellow-400"
                  style={{
                    left: `${20 + i * 20}%`,
                    top: `${30 + i * 10}%`,
                    animation: `floatingText 4s ${i * 0.5}s ease-out both`,
                    textShadow: '0 0 10px rgba(255, 255, 0, 0.8)'
                  }}
                >
                  {text}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Revolutionary CSS Animations - Enhanced Performance & Visual Appeal */}
      <style>{`
        /* Enhanced entrance animations */
        @keyframes enhancedLetterEntrance {
          0% { 
            opacity: 0; 
            transform: translateY(50px) scale(0.5) rotateY(180deg) rotateX(45deg); 
            filter: blur(10px);
          }
          30% {
            opacity: 0.7;
            transform: translateY(-10px) scale(1.1) rotateY(45deg) rotateX(15deg);
            filter: blur(2px);
          }
          60% {
            transform: translateY(5px) scale(0.98) rotateY(-10deg) rotateX(-5deg);
            filter: blur(0px);
          }
          100% { 
            opacity: 1; 
            transform: translateY(0) scale(1) rotateY(0deg) rotateX(0deg); 
            filter: blur(0px);
          }
        }
        
        /* Enhanced strike-through animation */
        @keyframes enhancedStrikeGrow {
          0% { 
            width: 0; 
            opacity: 0; 
            transform: rotate(45deg) scaleY(0);
          }
          20% {
            opacity: 1;
            transform: rotate(45deg) scaleY(0.3);
          }
          60% { 
            width: 100%; 
            transform: rotate(45deg) scaleY(1.2);
          }
          80% {
            transform: rotate(45deg) scaleY(0.8);
          }
          100% { 
            width: 100%; 
            opacity: 1; 
            transform: rotate(45deg) scaleY(1);
          }
        }
        
        /* Enhanced shimmer effect */
        @keyframes enhancedShimmer {
          0% { 
            transform: translateX(-150%) skewX(-20deg); 
            opacity: 0; 
          }
          50% { 
            transform: translateX(0%) skewX(-20deg); 
            opacity: 1; 
          }
          100% { 
            transform: translateX(150%) skewX(-20deg); 
            opacity: 0; 
          }
        }
        
        /* Spectacular entrance for completion text */
        @keyframes spectacularEntrance {
          0% { 
            opacity: 0; 
            transform: translateY(100px) scale(0.3) rotateZ(-10deg); 
            filter: blur(20px);
          }
          30% {
            opacity: 0.8;
            transform: translateY(-30px) scale(1.1) rotateZ(5deg);
            filter: blur(5px);
          }
          60% { 
            transform: translateY(10px) scale(0.95) rotateZ(-2deg); 
            filter: blur(1px);
          }
          100% { 
            opacity: 1; 
            transform: translateY(0) scale(1) rotateZ(0deg); 
            filter: blur(0px);
          }
        }
        
        /* Enhanced floating animation for ambient particles */
        @keyframes enhancedFloat {
          0%, 100% { 
            transform: translateY(0px) translateX(0px) rotate(0deg); 
            opacity: 0.4; 
          }
          25% {
            transform: translateY(-30px) translateX(15px) rotate(90deg);
            opacity: 0.8;
          }
          50% { 
            transform: translateY(-50px) translateX(-10px) rotate(180deg); 
            opacity: 1; 
          }
          75% {
            transform: translateY(-20px) translateX(-25px) rotate(270deg);
            opacity: 0.6;
          }
        }
        
        /* Letter glow effect */
        @keyframes letterGlow {
          0%, 100% {
            text-shadow: 0 0 30px rgba(20, 184, 166, 0.8), 0 0 60px rgba(20, 184, 166, 0.4);
            filter: brightness(1.1);
          }
          50% {
            text-shadow: 0 0 50px rgba(20, 184, 166, 1), 0 0 100px rgba(20, 184, 166, 0.6);
            filter: brightness(1.3);
          }
        }
        
        /* Strike glow effect */
        @keyframes strikeGlow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        
        /* Magnetic field effect */
        @keyframes magneticField {
          0%, 100% { 
            transform: scale(1) rotate(0deg); 
            opacity: 0.3; 
          }
          50% { 
            transform: scale(1.05) rotate(180deg); 
            opacity: 0.7; 
          }
        }
        
        /* Victory pulse effect */
        @keyframes victoryPulse {
          0%, 100% { transform: scale(1.2); opacity: 0.7; }
          50% { transform: scale(1.4); opacity: 1; }
        }
        
        /* Prismatic text effect */
        @keyframes prismEffect {
          0%, 100% {
            filter: hue-rotate(0deg) brightness(1.2);
          }
          25% {
            filter: hue-rotate(90deg) brightness(1.4);
          }
          50% {
            filter: hue-rotate(180deg) brightness(1.1);
          }
          75% {
            filter: hue-rotate(270deg) brightness(1.3);
          }
        }
        
        /* Text floating effect */
        @keyframes textFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        /* Typewriter effect */
        @keyframes typewriterEffect {
          0% { 
            width: 0; 
            opacity: 0; 
          }
          50% {
            opacity: 1;
          }
          100% { 
            width: 100%; 
            opacity: 1; 
          }
        }
        
        /* Shooting star effect */
        @keyframes shootingStar {
          0% {
            opacity: 0;
            transform: translateX(-100px) translateY(50px);
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translateX(300px) translateY(-50px);
          }
        }
        
        /* Energy wave effect */
        @keyframes energyWave {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          100% {
            transform: scale(4);
            opacity: 0;
          }
        }
        
        /* Enhanced particle animations */
        ${[...Array(4)].map((_, i) => `
          @keyframes enhancedFloatParticle${i} {
            0% { 
              transform: translate(-50%, -50%) rotate(0deg) translateY(0px) scale(0); 
              opacity: 1; 
            }
            25% {
              transform: translate(-50%, -50%) rotate(90deg) translateY(-${30 + i * 10}px) scale(1);
              opacity: 0.8;
            }
            50% {
              transform: translate(-50%, -50%) rotate(180deg) translateY(-${50 + i * 15}px) scale(0.8);
              opacity: 0.6;
            }
            75% {
              transform: translate(-50%, -50%) rotate(270deg) translateY(-${30 + i * 10}px) scale(1.1);
              opacity: 0.4;
            }
            100% { 
              transform: translate(-50%, -50%) rotate(360deg) translateY(0px) scale(0); 
              opacity: 0; 
            }
          }
        `).join('')}
        
        /* Sparkle effects */
        ${[...Array(3)].map((_, i) => `
          @keyframes sparkleEffect${i} {
            0% { 
              transform: translate(-50%, -50%) scale(0) rotate(0deg); 
              opacity: 1; 
            }
            50% {
              transform: translate(-50%, -50%) scale(1) rotate(180deg) translateY(-${40 + i * 20}px);
              opacity: 0.8;
            }
            100% { 
              transform: translate(-50%, -50%) scale(0) rotate(360deg) translateY(-${80 + i * 30}px); 
              opacity: 0; 
            }
          }
        `).join('')}
        
        /* Energy ring animations */
        @keyframes energyRing {
          0% {
            transform: scale(1);
            opacity: 0.8;
          }
          100% {
            transform: scale(2.5);
            opacity: 0;
          }
        }
        
        /* Confetti burst animations */
        ${[...Array(8)].map((_, i) => `
          @keyframes confettiBurst${i} {
            0% { 
              transform: translate(-50%, -50%) rotate(${i * 45}deg) translateY(0px) scale(0); 
              opacity: 1; 
            }
            20% {
              transform: translate(-50%, -50%) rotate(${i * 45 + 180}deg) translateY(-${100 + i * 30}px) scale(1);
              opacity: 1;
            }
            80% {
              transform: translate(-50%, -50%) rotate(${i * 45 + 720}deg) translateY(-${200 + i * 50}px) scale(0.5);
              opacity: 0.5;
            }
            100% { 
              transform: translate(-50%, -50%) rotate(${i * 45 + 1080}deg) translateY(-${300 + i * 70}px) scale(0); 
              opacity: 0; 
            }
          }
        `).join('')}
        
        /* Firework sparkle animation */
        @keyframes fireworkSparkle {
          0% { 
            transform: scale(0); 
            opacity: 1; 
          }
          50% {
            transform: scale(1.5);
            opacity: 0.8;
          }
          100% { 
            transform: scale(0); 
            opacity: 0; 
          }
        }
        
        /* Energy wave expansion */
        @keyframes energyWaveExpand {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 0.8;
          }
          100% {
            transform: translate(-50%, -50%) scale(8);
            opacity: 0;
          }
        }
        
        /* Floating text animation */
        @keyframes floatingText {
          0% {
            opacity: 0;
            transform: translateY(0px) scale(0.5);
          }
          20% {
            opacity: 1;
            transform: translateY(-20px) scale(1);
          }
          80% {
            opacity: 1;
            transform: translateY(-60px) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-100px) scale(0.5);
          }
        }
        
        /* Gradient radial utility */
        .bg-gradient-radial {
          background: radial-gradient(circle, var(--tw-gradient-stops));
        }
      `}</style>
    </div>
  );
};

export default BingoAnimation;
