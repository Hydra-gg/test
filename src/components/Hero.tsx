'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Rocket, Calendar } from 'lucide-react';
import BriefingModal from '@/components/modals/BriefingModal';

// Default shader source - exact match from escalate-website
const defaultShaderSource = `#version 300 es
precision highp float;
out vec4 O;
uniform vec2 resolution;
uniform float time;
#define FC gl_FragCoord.xy
#define T time
#define R resolution
#define MN min(R.x,R.y)

float rnd(vec2 p) {
  p=fract(p*vec2(12.9898,78.233));
  p+=dot(p,p+34.56);
  return fract(p.x*p.y);
}

float noise(in vec2 p) {
  vec2 i=floor(p), f=fract(p), u=f*f*(3.-2.*f);
  float a=rnd(i), b=rnd(i+vec2(1,0)), c=rnd(i+vec2(0,1)), d=rnd(i+1.);
  return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);
}

float fbm(vec2 p) {
  float t=.0, a=1.; mat2 m=mat2(1.,-.5,.2,1.2);
  for (int i=0; i<5; i++) {
    t+=a*noise(p);
    p*=2.*m;
    a*=.5;
  }
  return t;
}

float clouds(vec2 p) {
  float d=1., t=.0;
  for (float i=.0; i<3.; i++) {
    float a=d*fbm(i*10.+p.x*.2+.2*(1.+i)*p.y+d+i*i+p);
    t=mix(t,d,a);
    d=a;
    p*=2./(i+1.);
  }
  return t;
}

void main(void) {
  vec2 uv=(FC-.5*R)/MN,st=uv*vec2(2,1);
  vec3 col=vec3(0);
  float bg=clouds(vec2(st.x+T*.04,-st.y));
  uv*=1.-.2*(sin(T*.02)*.5+.5);
  for (float i=1.; i<12.; i++) {
    uv+=.08*cos(i*vec2(.1+.01*i, .8)+i*i+T*.05+.1*uv.x);
    vec2 p=uv;
    float d=length(p);
    col+=.0/d*(cos(sin(i)*vec3(0.77, 0.63, 0.35))+1.0);
    float b=noise(i+p+bg*1.2);
    col+=.0*b/length(max(p,vec2(b*p.x*.015,p.y)));
    col=mix(col,vec3(bg*.18, bg*.15, bg*.10),d);
  }
  O=vec4(col,1);
}`;

// WebGL Renderer Hook
const useShaderBackground = (isMobile: boolean) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number | null>(null);
    const rendererRef = useRef<WebGLRenderer | null>(null);

    class WebGLRenderer {
        private canvas: HTMLCanvasElement;
        private gl: WebGL2RenderingContext;
        private program: WebGLProgram | null = null;
        private vs: WebGLShader | null = null;
        private fs: WebGLShader | null = null;
        private buffer: WebGLBuffer | null = null;
        private scale: number;
        private deleted = false;

        private vertexSrc = `#version 300 es
precision highp float;
in vec4 position;
void main(){gl_Position=position;}`;

        private vertices = [-1, 1, -1, -1, 1, 1, 1, -1];

        constructor(canvas: HTMLCanvasElement, scale: number) {
            this.canvas = canvas;
            this.scale = scale;
            this.gl = canvas.getContext('webgl2')!;
            this.gl.viewport(0, 0, canvas.width * scale, canvas.height * scale);
        }

        updateScale(scale: number) {
            this.scale = scale;
            this.gl.viewport(0, 0, this.canvas.width * scale, this.canvas.height * scale);
        }

        compile(shader: WebGLShader, source: string) {
            const gl = this.gl;
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
        }

        reset() {
            if (this.deleted) return;
            this.deleted = true;
            const gl = this.gl;
            if (this.program && !gl.getProgramParameter(this.program, gl.DELETE_STATUS)) {
                if (this.vs) { gl.detachShader(this.program, this.vs); gl.deleteShader(this.vs); }
                if (this.fs) { gl.detachShader(this.program, this.fs); gl.deleteShader(this.fs); }
                gl.deleteProgram(this.program);
            }
        }

        setup() {
            const gl = this.gl;
            this.vs = gl.createShader(gl.VERTEX_SHADER)!;
            this.fs = gl.createShader(gl.FRAGMENT_SHADER)!;
            this.compile(this.vs, this.vertexSrc);
            this.compile(this.fs, defaultShaderSource);
            this.program = gl.createProgram()!;
            gl.attachShader(this.program, this.vs);
            gl.attachShader(this.program, this.fs);
            gl.linkProgram(this.program);
        }

        init() {
            const gl = this.gl;
            const program = this.program!;
            this.buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
            const position = gl.getAttribLocation(program, 'position');
            gl.enableVertexAttribArray(position);
            gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
            (program as unknown as { resolution: WebGLUniformLocation }).resolution = gl.getUniformLocation(program, 'resolution')!;
            (program as unknown as { time: WebGLUniformLocation }).time = gl.getUniformLocation(program, 'time')!;
        }

        render(now = 0) {
            if (this.deleted) return;
            const gl = this.gl;
            const program = this.program;
            if (!program || gl.getProgramParameter(program, gl.DELETE_STATUS)) return;
            gl.clearColor(0, 0, 0, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.useProgram(program);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
            gl.uniform2f((program as unknown as { resolution: WebGLUniformLocation }).resolution, this.canvas.width, this.canvas.height);
            gl.uniform1f((program as unknown as { time: WebGLUniformLocation }).time, now * 1e-3);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
    }

    const isInViewRef = useRef(true);

    useEffect(() => {
        if (!canvasRef.current || isMobile) return;

        const observer = new IntersectionObserver(([entry]) => {
            isInViewRef.current = entry.isIntersecting;
        });

        observer.observe(canvasRef.current);
        return () => observer.disconnect();
    }, [isMobile]);

    useEffect(() => {
        if (!canvasRef.current || isMobile) return;
        const canvas = canvasRef.current;
        const dpr = Math.max(1, 0.5 * window.devicePixelRatio);
        rendererRef.current = new WebGLRenderer(canvas, dpr);
        rendererRef.current.setup();
        rendererRef.current.init();

        const resize = () => {
            const dpr = Math.max(1, 0.5 * window.devicePixelRatio);
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            if (rendererRef.current) rendererRef.current.updateScale(dpr);
        };

        const loop = (now: number) => {
            if (!rendererRef.current) return;
            if (isInViewRef.current) {
                rendererRef.current.render(now);
            }
            animationFrameRef.current = requestAnimationFrame(loop);
        };

        resize();
        loop(0);
        window.addEventListener('resize', resize);
        return () => {
            window.removeEventListener('resize', resize);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            if (rendererRef.current) rendererRef.current.reset();
        };
    }, [isMobile]);

    return canvasRef;
};

// Hero Component - exact styling match
const Hero: React.FC = () => {
    const isMobile = useIsMobile();
    const canvasRef = useShaderBackground(isMobile);
    const [isBriefingOpen, setIsBriefingOpen] = useState(false);

    const handleScaleReach = () => {
        const el = document.getElementById('pricing');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    };

    const handleBriefing = () => {
        setIsBriefingOpen(true);
    };

    return (
        <div className="relative w-full h-[100dvh] bg-obsidian-deep overflow-hidden">
            {/* Background: Shader on Desktop, Static Gradient + Image on Mobile */}
            <div className="absolute inset-0 w-full h-full z-0">
                {!isMobile ? (
                    <canvas
                        ref={canvasRef}
                        className="w-full h-full object-cover"
                        style={{ background: 'black' }}
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#0A0A0C] via-[#12121A] to-[#0A0A0C]">
                        {/* Mobile background image */}
                        <div
                            className="absolute inset-0 opacity-30"
                            style={{
                                backgroundImage: 'url(https://images.unsplash.com/photo-1639322537228-f710d846310a?w=800&q=60)',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                            }}
                        />
                        {/* Mobile ambient glow */}
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(197,160,89,0.12)_0%,transparent_50%)]" />
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(100,80,50,0.08)_0%,transparent_40%)]" />
                        {/* Dark overlay for readability */}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
                    </div>
                )}
                {/* Vignette overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(10,10,11,0.8)_100%)] pointer-events-none" />
            </div>

            {/* Hero Content */}
            <div className="relative z-10 w-full h-full flex flex-col items-center justify-center text-white px-4 md:px-0 py-20 select-none">
                {/* Badge */}
                <div className="mb-6 md:mb-10">
                    <div className="inline-flex items-center gap-2.5 md:gap-3 px-4 md:px-5 py-2 md:py-2.5 bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-full">
                        <div className="relative flex items-center justify-center w-2 h-2">
                            <span className="absolute inset-0 bg-gold rounded-full animate-ping opacity-75" />
                            <span className="relative w-2 h-2 bg-gold rounded-full" />
                        </div>
                        <span className="text-white/70 uppercase tracking-[0.15em] md:tracking-[0.2em] text-[10px] md:text-[11px] font-medium leading-none">
                            BUSINESS AI · OPERATIONAL
                        </span>
                    </div>
                </div>

                {/* Headlines - exact match */}
                <div className="text-center max-w-6xl mx-auto px-4 md:px-6">
                    <div className="space-y-1 md:space-y-2 mb-6 md:mb-8">
                        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-9xl font-serif font-black tracking-tighter leading-[1] text-white">
                            Scale with Precision
                        </h1>
                        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-9xl font-serif font-black tracking-tighter leading-[1.1] italic gold-mask-text pb-1 md:pb-2">
                            Dominate with AI.
                        </h1>
                    </div>

                    {/* Subtitle */}
                    <p className="max-w-2xl mx-auto text-base md:text-lg lg:text-xl text-platinum/85 font-light leading-relaxed tracking-wide">
                        Escalate is a Growth Agency powered by proprietary AI systems
                        <br />
                        We scale your marketing while you focus on the business
                    </p>

                    {/* Buttons - exact match */}
                    <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center mt-10 md:mt-14 select-auto">
                        <button
                            onClick={handleScaleReach}
                            className="group btn-premium flex items-center justify-center gap-2.5 w-full sm:w-auto px-6 py-4 md:py-3.5 text-white font-bold uppercase tracking-[0.1em] text-sm rounded-xl md:rounded-lg shadow-[0_4px_15px_rgba(197,160,89,0.2)] hover:shadow-[0_6px_25px_rgba(197,160,89,0.3)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 ease-out"
                            style={{
                                background: 'linear-gradient(135deg, #8C6F3D 0%, #C5A059 50%, #F2D29F 100%)',
                            }}
                        >
                            <Rocket size={16} className="group-hover:rotate-12 transition-transform duration-300" />
                            Scale your Business
                        </button>
                        <button
                            onClick={handleBriefing}
                            className="group btn-premium flex items-center justify-center gap-2.5 w-full sm:w-auto px-6 py-4 md:py-3.5 bg-white hover:bg-white/95 border border-white/20 text-obsidian font-bold uppercase tracking-[0.1em] text-sm rounded-xl md:rounded-lg shadow-[0_4px_15px_rgba(255,255,255,0.08)] hover:shadow-[0_6px_20px_rgba(255,255,255,0.12)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 ease-out"
                        >
                            <Calendar size={16} className="group-hover:scale-110 transition-transform duration-300" />
                            Schedule A Briefing
                        </button>
                    </div>
                </div>
            </div>
            <BriefingModal
                isOpen={isBriefingOpen}
                onClose={() => setIsBriefingOpen(false)}
            />
        </div>
    );
};

export default Hero;
