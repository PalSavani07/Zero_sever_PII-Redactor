<div align="center">
  <h1 align="center">CENSORED</h1>
  <p align="center">
    <strong>A Mathematically Verifiable, Zero-Server PII Sanitization Engine</strong>
  </p>
  <p align="center">
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
    <img src="https://img.shields.io/badge/WebAssembly-654FF0?style=for-the-badge&logo=webassembly&logoColor=white" alt="WASM" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  </p>
</div>

<br />

## 🔒 The Purpose

**CENSORED** (formerly *LocalRedact*) is an uncompromising, hyper-secure web application engineered for entirely client-side Personally Identifiable Information (PII) extraction and redaction.

In enterprise and high-security environments, sending sensitive logs, crash dumps, or user payloads to external APIs for sanitization is fundamentally unsafe. **CENSORED guarantees zero data exfiltration.** By enforcing a strict Content Security Policy (`default-src 'self'`) and leveraging isolated Web Workers, all token classification and regex processing executes locally inside the user's browser via WebAssembly (WASM) and WebGPU. 

## ⚡ How It Works

CENSORED employs a sophisticated **Hybrid Detection Pipeline**, divided into three distinct execution layers designed to run completely off the main thread to ensure the UI stays at a buttery-smooth 60 FPS.

### 1. Layer 1: Deterministic Math & Regex Engine
The first pass scans for highly structured secrets and PII that AI models typically hallucinate on. 
- **Shannon Entropy Scoring**: Generic API keys and active session cookies are identified contextually and mathematically evaluated using the Shannon Entropy formula ($H = -\sum (p_i \cdot \log_2(p_i))$). Any payload scoring $> 3.0$ is flagged.
- **Proximity Validation**: Short-digit PII (like 3-4 digit CVVs or short Expiry Dates) are aggressively validated using a 50-character radial proximity check to detect nearby 15/16-digit Credit Cards or keywords.
- **Enterprise Identification**: Automatically traps complex corporate nomenclature, such as internal server hostnames (e.g., `PROD-DB-01`) and confidential project markers (`PROJECT PHOENIX (CONFIDENTIAL)`).

### 2. Layer 2: Isolated AI Inference (`openai/privacy-filter`)
Unstructured context (like finding the name 'John Doe' in a random paragraph) is handled by a local `Transformers.js` (v4) Token Classification pipeline.
- **WebGPU Hardware Acceleration**: If the browser supports WebGPU, CENSORED dynamically loads the `q4f16` quantized model variants.
- **Sliding Window Chunking**: To process massively long documents without causing VRAM overflows, the engine slices the text into 200-word chunks rolling forward at a 150-word stride. This mathematically guarantees a 50-word overlapping reconciliation window, preventing PII entities from being split at the edge of a chunk.

### 3. Layer 3: Boundary Snapping & UI Slicing
Because subword tokenizers (like BPE) can cause severe offset misalignments (e.g., injecting `Ġ` markers or bleeding into spaces), CENSORED features algorithmic post-processing.
- **Subword Hallucination Defense**: If the AI model hallucinates and tags a fragmented token (like `er` inside the word `server`), the engine detects the adjacent alphanumeric bounds and surgically collapses the false positive.
- **$O(N)$ Flattened Rendering**: The React UI (`HighlighterView.tsx`) iterates the final unified spans precisely, slicing the original text string into flattened DOM nodes dynamically styled with harsh, high-contrast **Neobrutalist** Tailwind colors.

## 🛠 Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **React + TypeScript** | Strongly-typed, declarative UI engineering. |
| **Vite** | Blazing fast build tooling optimized for modern Web Workers. |
| **Tailwind CSS** | Utility-first styling utilized to create a jarring, raw Neobrutalist interface. |
| **Transformers.js (v4)** | Client-side Machine Learning library executing the HuggingFace models locally. |
| **Comlink** | Seamless RPC (Remote Procedure Call) proxying to offload heavy inference from the main UI thread. |

## 🚀 Getting Started

Because everything is configured for local browser caching and isolated execution, booting the project is incredibly simple.

```bash
# 1. Clone the repository
git clone https://github.com/PalSavani07/Zero_sever_PII-Redactor.git

# 2. Install dependencies
cd Zero_sever_PII-Redactor
npm install

# 3. Launch the Development Server
npm run dev
```

> **Note**: The first time you execute a redaction, the `openai/privacy-filter` model will be downloaded directly from HuggingFace to your browser's persistent cache. Subsequent executions will load instantly offline.

## 🎨 The Aesthetic
The application intentionally abandons modern "sleek" aesthetics in favor of function-over-form **Neobrutalism**. You will find stark white backgrounds, raw `#000000` borders, neon hazard highlights, and uncompromising heavy drop shadows. It is designed to feel like a raw security appliance.
