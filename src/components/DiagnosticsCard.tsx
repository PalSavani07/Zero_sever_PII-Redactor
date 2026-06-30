import type { HardwareDiagnostics } from '../core/diagnostics';

interface Props {
  diagnostics: HardwareDiagnostics | null;
}

export default function DiagnosticsCard({ diagnostics }: Props) {
  if (!diagnostics) {
    return (
      <div className="border-4 border-black bg-white p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4 animate-pulse" aria-busy="true">
        <div className="h-10 bg-black/10 border-2 border-black"></div>
        <div className="h-10 bg-black/10 border-2 border-black"></div>
      </div>
    );
  }

  const isRegexOnly = diagnostics.memoryStatus === 'low';

  return (
    <div className="border-4 border-black bg-white p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4">
      <div className="flex items-center justify-between border-b-4 border-black pb-3">
        <span className="font-black uppercase text-xl">System Profile</span>
      </div>
      
      <div className="flex items-center justify-between bg-white border-2 border-black p-3 font-bold">
        <span className="uppercase">Memory (RAM)</span>
        <span className={`px-2 border-2 border-black ${diagnostics.memoryStatus === 'good' ? 'bg-[#67D044]' : 'bg-[#FF0000] text-white'}`}>
          {diagnostics.memoryStatus === 'good' ? '≥ 4GB' : '< 4GB'}
        </span>
      </div>
      
      <div className="flex items-center justify-between bg-white border-2 border-black p-3 font-bold">
        <span className="uppercase">WebGPU</span>
        <span className={`px-2 border-2 border-black ${diagnostics.webGPUSupport ? 'bg-[#00FFFF]' : 'bg-[#FFFF00]'}`}>
          {diagnostics.webGPUSupport ? 'AVAILABLE' : 'CPU FALLBACK'}
        </span>
      </div>
      
      {isRegexOnly && (
        <div className="bg-[#FF0000] border-4 border-black p-4 mt-2" role="alert">
          <p className="font-black text-black uppercase text-center text-lg">
            WARNING: LOW MEMORY DETECTED. RUNNING IN REGEX-ONLY MODE.
          </p>
        </div>
      )}
      {!isRegexOnly && diagnostics.webGPUSupport && (
        <div className="bg-[#67D044] border-4 border-black p-3 mt-2" role="status">
          <p className="font-black text-black uppercase text-center">
            READY FOR HIGH-PERFORMANCE WEBGPU EXECUTION
          </p>
        </div>
      )}
      {!isRegexOnly && !diagnostics.webGPUSupport && (
        <div className="bg-[#FFFF00] border-4 border-black p-3 mt-2" role="status">
          <p className="font-black text-black uppercase text-center">
            USING WEBASSEMBLY CPU EXECUTION
          </p>
        </div>
      )}
    </div>
  );
}
