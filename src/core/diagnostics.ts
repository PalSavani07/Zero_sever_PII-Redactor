export interface HardwareDiagnostics {
  memoryStatus: 'good' | 'low';
  webGPUSupport: boolean;
}

export function checkMemory(): 'good' | 'low' {
  // navigator.deviceMemory returns the amount of device memory in GB
  // Typically returns 0.25, 0.5, 1, 2, 4, 8
  const memory = (navigator as any).deviceMemory || 8; // default to 8 if not supported
  return memory < 4 ? 'low' : 'good';
}

export async function checkWebGPU(): Promise<boolean> {
  if (!navigator.gpu) {
    return false;
  }
  try {
    const adapter = await navigator.gpu.requestAdapter();
    return !!adapter;
  } catch (e) {
    return false;
  }
}

export async function getHardwareDiagnostics(): Promise<HardwareDiagnostics> {
  const memoryStatus = checkMemory();
  const webGPUSupport = await checkWebGPU();
  return { memoryStatus, webGPUSupport };
}
