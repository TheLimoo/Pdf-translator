"use client";

import { useState, useEffect, useRef } from "react";
import { 
  FileText, 
  UploadCloud, 
  Languages, 
  Cpu, 
  Sliders, 
  Download, 
  RefreshCw, 
  Play, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Terminal, 
  Sparkles, 
  Copy, 
  Globe, 
  Layers, 
  Trash2, 
  Settings2,
  ChevronRight,
  BookOpen,
  Folder,
  FolderPlus,
  FolderOpen,
  Save,
  Plus,
  History
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Types
interface LogMessage {
  id: string;
  timestamp: string;
  type: "info" | "success" | "warning" | "error";
  message: string;
}

interface PageText {
  pageNum: number;
  text: string;
}

interface Chunk {
  id: number;
  title: string;
  text: string;
  pages: number[];
  status: "pending" | "translating" | "completed" | "failed";
  translatedText?: string;
  error?: string;
  timeTaken?: number; // in seconds
}

interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  targetLanguage: string;
  tone: string;
  industry: string;
  model: string;
  chunkMode: "page" | "char";
  charLimit: number;
  chunks: Chunk[];
  extractedPages: PageText[];
  logs: LogMessage[];
  referenceFileName?: string;
}

export default function Home() {
  // Hydration safety flag
  const [mounted, setMounted] = useState(false);

  // Saved Projects state
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  // Config state
  const [targetLanguage, setTargetLanguage] = useState("Persian");
  const [tone, setTone] = useState("Professional");
  const [industry, setIndustry] = useState("General");
  const [model, setModel] = useState("gemini-2.0-flash");
  const [chunkMode, setChunkMode] = useState<"page" | "char">("char");
  const [charLimit, setCharLimit] = useState(4000);

  // File and Parsing state
  const [file, setFile] = useState<File | null>(null);
  const [pdfJsLoaded, setPdfJsLoaded] = useState(false);
  const [pdfJsError, setPdfJsError] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState({ current: 0, total: 0 });
  const [extractedPages, setExtractedPages] = useState<PageText[]>([]);
  
  // Pre-translated Reference File state
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [isProcessingRef, setIsProcessingRef] = useState(false);
  const [refParseProgress, setRefParseProgress] = useState({ current: 0, total: 0 });
  
  // Translation state
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [isCopied, setIsCopied] = useState(false);
  
  // Settings view toggle
  const [showSettings, setShowSettings] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const refFileInputRef = useRef<HTMLInputElement>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Load PDF.js CDN
  useEffect(() => {
    addLog("Loading PDF processing engine...", "info");
    
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js";
    script.async = true;
    
    script.onload = () => {
      const pdfjsLib = (window as any).pdfjsLib;
      if (pdfjsLib) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";
        setPdfJsLoaded(true);
        addLog("PDF processing engine loaded successfully.", "success");
      } else {
        setPdfJsError(true);
        addLog("Failed to initialize PDF engine.", "error");
      }
    };

    script.onerror = () => {
      setPdfJsError(true);
      addLog("Failed to fetch PDF engine script from CDN. Please check your network.", "error");
    };

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Load settings & projects from LocalStorage on mount
  useEffect(() => {
    setMounted(true);
    
    // Load config settings
    const savedLang = localStorage.getItem("transdoc_targetLanguage");
    if (savedLang) setTargetLanguage(savedLang);
    
    const savedTone = localStorage.getItem("transdoc_tone");
    if (savedTone) setTone(savedTone);
    
    const savedIndustry = localStorage.getItem("transdoc_industry");
    if (savedIndustry) setIndustry(savedIndustry);
    
    const savedModel = localStorage.getItem("transdoc_model");
    if (savedModel) setModel(savedModel);
    
    const savedChunkMode = localStorage.getItem("transdoc_chunkMode");
    if (savedChunkMode === "page" || savedChunkMode === "char") setChunkMode(savedChunkMode);
    
    const savedCharLimit = localStorage.getItem("transdoc_charLimit");
    if (savedCharLimit) setCharLimit(parseInt(savedCharLimit, 10));
    
    // Load projects list
    const savedProjects = localStorage.getItem("transdoc_projects");
    if (savedProjects) {
      try {
        const parsed = JSON.parse(savedProjects);
        setProjects(parsed);
        // Load active project if stored
        const savedActiveId = localStorage.getItem("transdoc_activeProjectId");
        if (savedActiveId && parsed.some((p: Project) => p.id === savedActiveId)) {
          const activeProj = parsed.find((p: Project) => p.id === savedActiveId);
          if (activeProj) {
            // Restore file and settings
            const mockFile = new File([""], activeProj.name, { type: "application/pdf" });
            setFile(mockFile);
            setTargetLanguage(activeProj.targetLanguage);
            setTone(activeProj.tone);
            setIndustry(activeProj.industry);
            setModel(activeProj.model);
            setChunkMode(activeProj.chunkMode);
            setCharLimit(activeProj.charLimit);
            setChunks(activeProj.chunks);
            setExtractedPages(activeProj.extractedPages);
            setLogs(activeProj.logs);
            if (activeProj.referenceFileName) {
              setReferenceFile(new File([""], activeProj.referenceFileName, { type: "application/pdf" }));
            }
            setActiveProjectId(savedActiveId);
          }
        }
      } catch (e) {
        console.error("Failed to parse saved projects from local storage", e);
      }
    }
  }, []);

  // Save config settings to LocalStorage automatically on change
  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("transdoc_targetLanguage", targetLanguage);
    localStorage.setItem("transdoc_tone", tone);
    localStorage.setItem("transdoc_industry", industry);
    localStorage.setItem("transdoc_model", model);
    localStorage.setItem("transdoc_chunkMode", chunkMode);
    localStorage.setItem("transdoc_charLimit", charLimit.toString());
  }, [targetLanguage, tone, industry, model, chunkMode, charLimit, mounted]);

  // Save current active project status/autosave on update
  useEffect(() => {
    if (!mounted || !activeProjectId) return;
    
    setProjects((prev) => {
      const activeProj = prev.find((p) => p.id === activeProjectId);
      if (!activeProj) return prev;
      
      const updatedProj: Project = {
        ...activeProj,
        updatedAt: new Date().toLocaleString(),
        targetLanguage,
        tone,
        industry,
        model,
        chunkMode,
        charLimit,
        chunks,
        extractedPages,
        logs,
        referenceFileName: referenceFile?.name || undefined
      };
      
      const updatedList = prev.map((p) => (p.id === activeProjectId ? updatedProj : p));
      localStorage.setItem("transdoc_projects", JSON.stringify(updatedList));
      return updatedList;
    });
  }, [chunks, extractedPages, logs, targetLanguage, tone, industry, model, chunkMode, charLimit, referenceFile, activeProjectId, mounted]);

  // Project utilities
  const saveCurrentAsProject = (customName?: string) => {
    if (!file && chunks.length === 0) {
      addLog("No active document or chunk structure to save as a project.", "warning");
      return;
    }

    const projId = activeProjectId || Math.random().toString(36).substring(7);
    const projName = customName || (file ? file.name : `Translation Project - ${targetLanguage}`);
    const now = new Date().toLocaleString();

    const newProject: Project = {
      id: projId,
      name: projName,
      createdAt: activeProjectId ? (projects.find(p => p.id === activeProjectId)?.createdAt || now) : now,
      updatedAt: now,
      targetLanguage,
      tone,
      industry,
      model,
      chunkMode,
      charLimit,
      chunks,
      extractedPages,
      logs,
      referenceFileName: referenceFile?.name || undefined
    };

    setProjects((prev) => {
      const exists = prev.some((p) => p.id === projId);
      let updated;
      if (exists) {
        updated = prev.map((p) => (p.id === projId ? newProject : p));
      } else {
        updated = [newProject, ...prev];
      }
      localStorage.setItem("transdoc_projects", JSON.stringify(updated));
      return updated;
    });

    setActiveProjectId(projId);
    localStorage.setItem("transdoc_activeProjectId", projId);
    addLog(`Project "${projName}" saved successfully and linked for automatic updates.`, "success");
  };

  const loadProject = (proj: Project) => {
    addLog(`Loading project: "${proj.name}"...`, "info");
    
    const mockFile = new File([""], proj.name, { type: "application/pdf" });
    setFile(mockFile);
    
    setTargetLanguage(proj.targetLanguage);
    setTone(proj.tone);
    setIndustry(proj.industry);
    setModel(proj.model);
    setChunkMode(proj.chunkMode);
    setCharLimit(proj.charLimit);
    setChunks(proj.chunks);
    setExtractedPages(proj.extractedPages);
    setLogs(proj.logs);
    
    if (proj.referenceFileName) {
      setReferenceFile(new File([""], proj.referenceFileName, { type: "application/pdf" }));
    } else {
      setReferenceFile(null);
    }
    
    setActiveProjectId(proj.id);
    localStorage.setItem("transdoc_activeProjectId", proj.id);
    addLog(`Project loaded successfully. You can continue on segments directly into web app!`, "success");
  };

  const deleteProject = (projId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent loading when clicking delete
    
    const confirmDelete = window.confirm("Are you sure you want to delete this project? This cannot be undone.");
    if (!confirmDelete) return;

    setProjects((prev) => {
      const updated = prev.filter((p) => p.id !== projId);
      localStorage.setItem("transdoc_projects", JSON.stringify(updated));
      return updated;
    });

    if (activeProjectId === projId) {
      setActiveProjectId(null);
      localStorage.removeItem("transdoc_activeProjectId");
      setFile(null);
      setChunks([]);
      setExtractedPages([]);
      setReferenceFile(null);
      addLog("Active project deleted. Workspace cleared.", "info");
    } else {
      addLog("Project deleted successfully.", "success");
    }
  };

  const startNewProject = () => {
    setActiveProjectId(null);
    localStorage.removeItem("transdoc_activeProjectId");
    setFile(null);
    setChunks([]);
    setExtractedPages([]);
    setReferenceFile(null);
    setLogs([]);
    addLog("Created a fresh workspace. Ready to upload a new novel/PDF!", "info");
  };

  // Log helper
  const addLog = (message: string, type: "info" | "success" | "warning" | "error" = "info") => {
    const now = new Date();
    const timestamp = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setLogs((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(7),
        timestamp,
        type,
        message,
      },
    ]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "application/pdf") {
      processFile(droppedFile);
    } else {
      addLog("Unsupported file format. Please drop a valid PDF file.", "error");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const handleRefFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processReferenceFile(selectedFile);
    }
  };

  const clearCurrentFile = () => {
    setFile(null);
    setExtractedPages([]);
    setChunks([]);
    setIsTranslating(false);
    setReferenceFile(null);
    setIsProcessingRef(false);
    addLog("Active document cleared.", "info");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (refFileInputRef.current) {
      refFileInputRef.current.value = "";
    }
  };

  const clearReferenceFile = () => {
    setReferenceFile(null);
    setIsProcessingRef(false);
    addLog("Reference translation file cleared.", "info");
    if (refFileInputRef.current) {
      refFileInputRef.current.value = "";
    }
    // Restore segments to their original pending state
    if (extractedPages.length > 0) {
      generateAndSetChunks(extractedPages, chunkMode, charLimit);
    }
  };

  const alignChunksWithReference = (refData: string | PageText[]) => {
    if (chunks.length === 0) {
      addLog("Please upload the source document PDF first so we can align the reference translations.", "warning");
      return;
    }

    addLog("Aligning reference translations with source document segments...", "info");

    let updatedChunks = [...chunks];
    let alignedCount = 0;

    // Case 1: Page-by-page PDF-to-PDF matching
    if (Array.isArray(refData) && extractedPages.length > 0) {
      addLog("Reference file is a PDF. Performing page-to-page alignment...", "info");
      
      updatedChunks = chunks.map((chunk) => {
        const matchedPageTexts: string[] = [];
        
        for (const pageNum of chunk.pages) {
          const refPage = refData.find((p) => p.pageNum === pageNum);
          if (refPage && refPage.text.trim().length > 5) {
            matchedPageTexts.push(refPage.text.trim());
          }
        }

        if (matchedPageTexts.length > 0) {
          alignedCount++;
          return {
            ...chunk,
            status: "completed" as const,
            translatedText: matchedPageTexts.join("\n\n"),
            error: undefined,
          };
        }
        return chunk;
      });
    } else {
      // Case 2: Proportional alignment (handles HTML / TXT or unmatched page count PDF)
      const fullRefText = typeof refData === "string" 
        ? refData 
        : refData.map((p) => p.text).join("\n\n");

      if (fullRefText.trim().length < 50) {
        addLog("Reference translation content is too short to perform alignment.", "error");
        return;
      }

      addLog("Reference is a text/HTML document. Performing proportional flow-based alignment...", "info");

      // Calculate original cumulative positions
      let originalCursor = 0;
      const chunksWithPositions = chunks.map((chunk) => {
        const start = originalCursor;
        const end = originalCursor + chunk.text.length;
        originalCursor = end + 1; // whitespace/newline joiner
        return { chunk, start, end };
      });
      const totalOriginalLength = Math.max(originalCursor, 1);

      updatedChunks = chunksWithPositions.map(({ chunk, start, end }) => {
        const startPct = start / totalOriginalLength;
        const endPct = end / totalOriginalLength;

        let refStart = Math.floor(startPct * fullRefText.length);
        let refEnd = Math.floor(endPct * fullRefText.length);

        // Adjust boundaries to avoid splitting a word
        while (refStart > 0 && /\w/.test(fullRefText[refStart - 1]) && /\w/.test(fullRefText[refStart])) {
          refStart--;
        }
        while (refEnd < fullRefText.length && /\w/.test(fullRefText[refEnd - 1]) && /\w/.test(fullRefText[refEnd])) {
          refEnd++;
        }

        // Snap to sentence boundary if nearby
        const sentenceBoundaryRegex = /[.!?](\s+|\n|$)/;
        
        let snappedStart = refStart;
        const startWindowMin = Math.max(0, refStart - 40);
        const startWindowMax = Math.min(fullRefText.length, refStart + 40);
        const startSubstring = fullRefText.substring(startWindowMin, startWindowMax);
        const startMatch = startSubstring.match(sentenceBoundaryRegex);
        if (startMatch && startMatch.index !== undefined) {
          snappedStart = startWindowMin + startMatch.index + startMatch[0].length;
        }

        let snappedEnd = refEnd;
        const endWindowMin = Math.max(0, refEnd - 40);
        const endWindowMax = Math.min(fullRefText.length, refEnd + 40);
        const endSubstring = fullRefText.substring(endWindowMin, endWindowMax);
        const endMatch = endSubstring.match(sentenceBoundaryRegex);
        if (endMatch && endMatch.index !== undefined) {
          snappedEnd = endWindowMin + endMatch.index + endMatch[0].length;
        }

        if (Math.abs(snappedStart - refStart) < 40) refStart = snappedStart;
        if (Math.abs(snappedEnd - refEnd) < 40) refEnd = snappedEnd;

        let slice = fullRefText.substring(refStart, refEnd).trim();

        if (slice.length === 0) {
          slice = fullRefText.substring(Math.floor(startPct * fullRefText.length), Math.floor(endPct * fullRefText.length)).trim();
        }

        if (slice.length > 5) {
          alignedCount++;
          return {
            ...chunk,
            status: "completed" as const,
            translatedText: slice,
            error: undefined,
          };
        }
        return chunk;
      });
    }

    setChunks(updatedChunks);
    addLog(`Matched & pre-filled ${alignedCount} of ${chunks.length} segments with existing translations!`, "success");
    addLog("You can now click 'Start Translation' to translate only the remaining segments.", "info");
  };

  const processReferenceFile = async (selectedFile: File) => {
    if (!file) {
      addLog("Please upload the original source PDF document first before uploading the reference translation.", "warning");
      return;
    }

    setReferenceFile(selectedFile);
    setIsProcessingRef(true);
    addLog(`Uploading reference translation: "${selectedFile.name}" (${(selectedFile.size / 1024).toFixed(1)} KB).`, "info");

    try {
      const extension = selectedFile.name.split(".").pop()?.toLowerCase();
      
      if (extension === "pdf") {
        addLog("Parsing reference PDF file...", "info");
        const arrayBuffer = await selectedFile.arrayBuffer();
        const pdfjsLib = (window as any).pdfjsLib;
        
        if (!pdfjsLib) {
          throw new Error("PDF engine is not ready. Please try again.");
        }

        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        const totalPages = pdf.numPages;
        setRefParseProgress({ current: 0, total: totalPages });
        addLog(`Detected ${totalPages} page(s) in reference PDF.`, "info");

        const refPagesList: PageText[] = [];
        for (let i = 1; i <= totalPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(" ");
          refPagesList.push({ pageNum: i, text: pageText });
          setRefParseProgress({ current: i, total: totalPages });
        }

        setIsProcessingRef(false);
        addLog("Reference PDF parsed successfully.", "success");
        alignChunksWithReference(refPagesList);
      } else if (extension === "html" || extension === "htm") {
        addLog("Parsing reference HTML file...", "info");
        const text = await selectedFile.text();
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, "text/html");
        
        const exportedBody = doc.querySelector(".content") || doc.body;
        const cleanText = exportedBody ? (exportedBody.textContent || "") : text;

        setIsProcessingRef(false);
        addLog("Reference HTML parsed successfully.", "success");
        alignChunksWithReference(cleanText);
      } else {
        addLog("Reading reference text file...", "info");
        const text = await selectedFile.text();
        setIsProcessingRef(false);
        addLog("Reference text file read successfully.", "success");
        alignChunksWithReference(text);
      }
    } catch (error: any) {
      setIsProcessingRef(false);
      addLog(`Failed to process reference translation file: ${error.message || error}`, "error");
    }
  };

  const processFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setExtractedPages([]);
    setChunks([]);
    setIsParsing(true);
    addLog(`Uploaded: "${selectedFile.name}" (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB).`, "info");
    addLog("Extracting document text page-by-page...", "info");

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdfjsLib = (window as any).pdfjsLib;
      
      if (!pdfjsLib) {
        throw new Error("PDF parser is still loading. Please wait or refresh the page.");
      }

      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const totalPages = pdf.numPages;
      setParseProgress({ current: 0, total: totalPages });
      addLog(`Detected ${totalPages} page(s) in document.`, "info");

      const pagesList: PageText[] = [];

      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ");
        
        pagesList.push({ pageNum: i, text: pageText });
        setParseProgress({ current: i, total: totalPages });
      }

      setExtractedPages(pagesList);
      setIsParsing(false);
      addLog("Successfully extracted raw text from all pages.", "success");

      // Generate initial chunks based on current settings
      generateAndSetChunks(pagesList, chunkMode, charLimit);
    } catch (error: any) {
      setIsParsing(false);
      addLog(`Failed to parse PDF document: ${error.message || error}`, "error");
    }
  };

  const generateAndSetChunks = (
    pages: PageText[],
    mode: "page" | "char",
    limit: number
  ) => {
    if (pages.length === 0) return;

    addLog(`Creating translation chunks using ${mode === "page" ? "Page-by-Page" : "Character Boundary"} splitting...`, "info");

    let chunkList: Chunk[] = [];

    if (mode === "page") {
      chunkList = pages.map((p, index) => ({
        id: index + 1,
        title: `Page ${p.pageNum}`,
        text: p.text,
        pages: [p.pageNum],
        status: "pending",
      }));
    } else {
      let currentChunkText = "";
      let currentPages: number[] = [];
      let chunkIndex = 1;

      for (const page of pages) {
        if ((currentChunkText + " " + page.text).length > limit && currentChunkText.length > 0) {
          chunkList.push({
            id: chunkIndex++,
            title: `Chunk ${chunkIndex - 1} (Pages ${currentPages.join(", ")})`,
            text: currentChunkText.trim(),
            pages: [...currentPages],
            status: "pending",
          });
          currentChunkText = page.text;
          currentPages = [page.pageNum];
        } else {
          currentChunkText += (currentChunkText ? " " : "") + page.text;
          if (!currentPages.includes(page.pageNum)) {
            currentPages.push(page.pageNum);
          }
        }
      }

      if (currentChunkText.trim().length > 0) {
        chunkList.push({
          id: chunkIndex,
          title: `Chunk ${chunkIndex} (Pages ${currentPages.join(", ")})`,
          text: currentChunkText.trim(),
          pages: [...currentPages],
          status: "pending",
        });
      }
    }

    setChunks(chunkList);
    addLog(`Split document into ${chunkList.length} segment(s) for translation.`, "success");
  };

  // Re-chunk if settings change
  const handleChunkSettingsChange = (mode: "page" | "char", limit: number) => {
    setChunkMode(mode);
    setCharLimit(limit);
    if (extractedPages.length > 0) {
      generateAndSetChunks(extractedPages, mode, limit);
    }
  };

  // Trigger individual chunk translation
  const translateChunk = async (chunkId: number): Promise<string> => {
    const chunk = chunks.find((c) => c.id === chunkId);
    if (!chunk) throw new Error("Chunk not found.");

    const startTime = Date.now();
    const response = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: chunk.text,
        lang: targetLanguage,
        tone: tone,
        model: model,
        industry: industry,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Server returned error status ${response.status}`);
    }

    const data = await response.json();
    const duration = parseFloat(((Date.now() - startTime) / 1000).toFixed(1));
    
    // Update chunk successfully
    setChunks((prev) =>
      prev.map((c) =>
        c.id === chunkId
          ? { ...c, status: "completed", translatedText: data.translation, timeTaken: duration }
          : c
      )
    );

    return duration.toString();
  };

  // Main translation sequence control
  const startTranslation = async () => {
    if (chunks.length === 0) {
      addLog("No active content to translate. Please upload a document first.", "warning");
      return;
    }

    setIsTranslating(true);
    addLog(`Initializing full document translation task...`, "info");
    addLog(`Parameters - Target Lang: ${targetLanguage} | Tone: ${tone} | Industry: ${industry} | Engine: ${model}`, "info");

    // Set non-pretranslated chunks to pending to start fresh, while preserving pre-translated ones
    setChunks((prev) =>
      prev.map((c) =>
        c.status === "completed" && c.translatedText
          ? c
          : { ...c, status: "pending", translatedText: undefined, error: undefined }
      )
    );

    let hasErrors = false;

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      // Skip chunks that are already completed with existing translations
      if (chunk.status === "completed" && chunk.translatedText) {
        addLog(`[Chunk ${chunk.id}/${chunks.length}] Existing translation found. Skipping segment...`, "success");
        continue;
      }

      addLog(`[Chunk ${chunk.id}/${chunks.length}] Submitting to ${model}...`, "info");
      
      // Update chunk status to translating
      setChunks((prev) =>
        prev.map((c) => (c.id === chunk.id ? { ...c, status: "translating" } : c))
      );

      let success = false;
      let attempt = 1;
      const maxAttempts = 2;

      while (!success && attempt <= maxAttempts) {
        try {
          const duration = await translateChunk(chunk.id);
          addLog(`[Chunk ${chunk.id}/${chunks.length}] Translated successfully in ${duration}s.`, "success");
          success = true;
        } catch (error: any) {
          addLog(`[Chunk ${chunk.id}/${chunks.length}] Attempt ${attempt} failed: ${error.message || error}`, "warning");
          attempt++;
          if (attempt <= maxAttempts) {
            addLog(`Retrying translation for Chunk ${chunk.id} in 2 seconds...`, "info");
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
        }
      }

      if (!success) {
        hasErrors = true;
        setChunks((prev) =>
          prev.map((c) => (c.id === chunk.id ? { ...c, status: "failed", error: "Translation failed after multiple attempts." } : c))
        );
        addLog(`[Chunk ${chunk.id}/${chunks.length}] Translation permanently failed.`, "error");
        
        // Ask if we should halt or continue
        addLog("Halting further translation due to segment failure.", "error");
        break;
      }
    }

    setIsTranslating(false);
    if (!hasErrors) {
      addLog("Full translation completed! Download links are now active below.", "success");
    } else {
      addLog("Translation completed with partial failures. You can retry individual failed chunks.", "warning");
    }
  };

  const retryFailedChunks = async () => {
    setIsTranslating(true);
    addLog("Retrying failed segments...", "info");

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (chunk.status !== "failed") continue;

      addLog(`[Chunk ${chunk.id}/${chunks.length}] Retrying segment...`, "info");
      setChunks((prev) =>
        prev.map((c) => (c.id === chunk.id ? { ...c, status: "translating", error: undefined } : c))
      );

      try {
        const duration = await translateChunk(chunk.id);
        addLog(`[Chunk ${chunk.id}/${chunks.length}] Translated successfully on retry in ${duration}s.`, "success");
      } catch (error: any) {
        setChunks((prev) =>
          prev.map((c) => (c.id === chunk.id ? { ...c, status: "failed", error: error.message } : c))
        );
        addLog(`[Chunk ${chunk.id}/${chunks.length}] Retry failed: ${error.message}`, "error");
        break; // Halt on subsequent failures
      }
    }
    setIsTranslating(false);
  };

  // Compute stats
  const completedChunksCount = chunks.filter((c) => c.status === "completed").length;
  const progressPercent = chunks.length > 0 ? Math.round((completedChunksCount / chunks.length) * 100) : 0;
  
  // Combine all translations
  const getFullTranslation = () => {
    return chunks
      .map((c) => c.translatedText || `[Segment ${c.title} - Translation Pending]`)
      .join("\n\n");
  };

  const getFullOriginal = () => {
    return chunks.map((c) => c.text).join("\n\n");
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getFullTranslation());
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Exporters
  const downloadTxt = () => {
    const text = getFullTranslation();
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${file?.name.replace(".pdf", "") || "document"}_translated_${targetLanguage}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    addLog("Downloaded plain text file (.txt).", "success");
  };

  const downloadMarkdown = () => {
    const text = `# Translated Document: ${file?.name || "Untitled Document"}\n` +
      `*Target Language:* ${targetLanguage}\n` +
      `*Tone:* ${tone}\n` +
      `*Industry/Glossary:* ${industry}\n` +
      `*Model Engine:* ${model}\n\n` +
      `---\n\n` +
      getFullTranslation();
    
    const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${file?.name.replace(".pdf", "") || "document"}_translated_${targetLanguage}.md`;
    link.click();
    URL.revokeObjectURL(url);
    addLog("Downloaded Markdown document (.md).", "success");
  };

  const downloadHtmlAsPdfGuide = () => {
    const isRtl = ["Persian", "Arabic", "Hebrew", "Urdu"].includes(targetLanguage);
    const dir = isRtl ? "rtl" : "ltr";
    
    const translationHtml = chunks
      .map((c) => {
        const text = c.translatedText || `[Segment ${c.title} - Translation Pending]`;
        const formattedText = text
          .split("\n\n")
          .map(para => `<p class="paragraph">${para.replace(/\n/g, "<br>")}</p>`)
          .join("");

        return `
        <div class="segment-card">
          <div class="segment-header">
            <span class="segment-badge">${c.title}</span>
            <span class="segment-pages">Pages: ${c.pages.join(", ")}</span>
          </div>
          <div class="segment-body">${formattedText}</div>
        </div>
        `;
      })
      .join("\n");

    const htmlContent = `
<!DOCTYPE html>
<html lang="${dir === "rtl" ? "fa" : "en"}" dir="${dir}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${file?.name.replace(".pdf", "") || "Document"} - Translated to ${targetLanguage}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;700&family=Inter:wght@300;400;500;600;700&display=swap');
    
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: ${isRtl ? "'Vazirmatn', sans-serif" : "'Inter', sans-serif"};
      line-height: 1.8;
      color: #f1f5f9;
      background-color: #090d16;
      margin: 0;
      padding: 40px 20px;
    }

    .container {
      max-width: 900px;
      margin: 0 auto;
    }

    .no-print-bar {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #e2e8f0;
      padding: 16px 24px;
      border-radius: 12px;
      margin-bottom: 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      font-family: 'Inter', sans-serif;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    }

    .no-print-bar strong {
      color: #38bdf8;
    }

    .btn {
      background: #0ea5e9;
      color: #ffffff;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.9rem;
      transition: all 0.2s ease;
      font-family: 'Inter', sans-serif;
      box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
    }

    .btn:hover {
      background: #0284c7;
      transform: translateY(-1px);
    }

    .header-card {
      background: linear-gradient(135deg, #131b2e 0%, #0c1220 100%);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 20px;
      padding: 35px;
      margin-bottom: 40px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    }

    h1 {
      margin: 0 0 15px 0;
      font-size: 2.2rem;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -0.025em;
    }

    .metadata-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-top: 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      padding-top: 20px;
    }

    .meta-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .meta-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      font-weight: 600;
    }

    .meta-value {
      font-size: 0.95rem;
      color: #cbd5e1;
      font-weight: 500;
    }

    .segment-card {
      background: #0f172a;
      border: 1px solid rgba(255, 255, 255, 0.04);
      border-radius: 16px;
      padding: 30px;
      margin-bottom: 30px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    }

    .segment-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-b: 1px solid rgba(255, 255, 255, 0.05);
    }

    .segment-badge {
      background: rgba(14, 165, 233, 0.1);
      color: #38bdf8;
      padding: 4px 12px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      font-family: 'Inter', sans-serif;
      border: 1px solid rgba(14, 165, 233, 0.2);
    }

    .segment-pages {
      font-size: 0.75rem;
      color: #64748b;
      font-family: 'Inter', sans-serif;
      font-weight: 500;
    }

    .segment-body {
      font-size: 1.1rem;
      color: #e2e8f0;
      text-align: justify;
    }

    .paragraph {
      margin: 0 0 16px 0;
    }

    .paragraph:last-child {
      margin-bottom: 0;
    }

    @media print {
      body {
        background-color: #090d16 !important;
        color: #f1f5f9 !important;
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
      .segment-card {
        page-break-inside: avoid;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
        box-shadow: none !important;
        background: #0f172a !important;
      }
      .header-card {
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
        box-shadow: none !important;
        background: #131b2e !important;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="no-print-bar no-print">
      <div>
        <strong>Modern Dark PDF Export:</strong> Ensure background graphics are enabled in your printer settings.
      </div>
      <button class="btn" onclick="window.print()">Print / Save as PDF</button>
    </div>
    
    <div class="header-card">
      <h1>${file?.name.replace(".pdf", "") || "Document"}</h1>
      <div class="metadata-grid">
        <div class="meta-item">
          <span class="meta-label">Target Language</span>
          <span class="meta-value">${targetLanguage}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Tone & Style</span>
          <span class="meta-value">${tone}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Terminology Glossary</span>
          <span class="meta-value">${industry} Context</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Translation Engine</span>
          <span class="meta-value">${model.replace("gemini-", "").replace("-", " ").toUpperCase()}</span>
        </div>
      </div>
    </div>

    <div class="content">
      ${translationHtml}
    </div>
  </div>
</body>
</html>
    `;

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${file?.name.replace(".pdf", "") || "document"}_translated_${targetLanguage}.html`;
    link.click();
    URL.revokeObjectURL(url);
    addLog("Generated clean print-to-PDF HTML document.", "success");
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_0%_0%,_#1e293b_0%,_#0f172a_100%)] text-slate-200 flex flex-col font-sans antialiased">
      {/* Header */}
      <header className="glass border-t-0 border-x-0 border-b border-white/10 bg-slate-950/20 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between rounded-none">
        <div className="flex items-center gap-3">
          <div className="glass w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border-white/10">
            <Languages className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              TransDoc AI
              <span className="text-xs bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded-full font-mono">
                Gemini Active
              </span>
            </h1>
            <p className="text-xs text-slate-400">Intelligent PDF Chunking & Translation</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border cursor-pointer ${
              showSettings 
                ? "bg-white/10 border-white/20 text-white shadow-lg shadow-white/5" 
                : "bg-transparent border-white/5 text-slate-400 hover:text-white"
            }`}
          >
            <Settings2 className="w-4 h-4" />
            <span>Settings {showSettings ? "Open" : "Closed"}</span>
          </button>
        </div>
      </header>

      {/* Main Panel Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Upload & Configuration Settings */}
        <div className={`space-y-6 ${showSettings ? "lg:col-span-4" : "lg:col-span-3 transition-all"}`}>
          
          {/* Translation Projects Management Card */}
          <div className="glass bg-white/3 border border-white/5 rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-sky-400" />
                Translation Projects
              </h3>
              <button
                onClick={startNewProject}
                className="text-[11px] bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/20 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                title="Clear workspace to start a fresh document"
              >
                <Plus className="w-3 h-3" />
                <span>Start Fresh</span>
              </button>
            </div>

            {/* Current Project Actions */}
            {file && (
              <div className="bg-slate-950/30 border border-white/5 rounded-xl p-3 mb-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">
                    Current Workspace
                  </span>
                  {activeProjectId ? (
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1 animate-pulse">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      Autosaving Active
                    </span>
                  ) : (
                    <span className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20 px-1.5 py-0.5 rounded-full font-medium">
                      Unsaved Draft
                    </span>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    defaultValue={file.name.replace(".pdf", "")}
                    placeholder="Project Name..."
                    onBlur={(e) => {
                      if (e.target.value.trim()) {
                        saveCurrentAsProject(e.target.value.trim());
                      }
                    }}
                    className="flex-1 text-xs bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-sky-500/50"
                  />
                  <button
                    onClick={() => saveCurrentAsProject()}
                    className="bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-lg shadow-sky-500/10 shrink-0"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{activeProjectId ? "Saved" : "Save"}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Saved Projects List */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
              {projects.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500 border border-dashed border-white/5 rounded-xl bg-white/1">
                  <Folder className="w-6 h-6 text-slate-600 mx-auto mb-1.5" />
                  No saved projects yet
                  <p className="text-[10px] text-slate-600 mt-1">Upload a PDF and save it to resume later</p>
                </div>
              ) : (
                projects.map((proj) => {
                  const compCount = proj.chunks.filter((c) => c.status === "completed").length;
                  const totalCount = proj.chunks.length;
                  const pct = totalCount > 0 ? Math.round((compCount / totalCount) * 100) : 0;
                  const isActive = activeProjectId === proj.id;

                  return (
                    <div
                      key={proj.id}
                      onClick={() => loadProject(proj)}
                      className={`group border rounded-xl p-2.5 cursor-pointer transition-all duration-200 relative text-left ${
                        isActive
                          ? "bg-sky-500/10 border-sky-500/40 shadow-lg shadow-sky-500/5"
                          : "bg-white/2 hover:bg-white/5 border-white/5 hover:border-white/10"
                      }`}
                    >
                      <button
                        onClick={(e) => deleteProject(proj.id, e)}
                        className="absolute right-2 top-2 p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all cursor-pointer z-10"
                        title="Delete project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex items-start gap-2.5 pr-6">
                        <div className={`p-1.5 rounded-lg border mt-0.5 ${
                          isActive 
                            ? "bg-sky-500/20 border-sky-500/30 text-sky-400" 
                            : "bg-white/5 border-white/5 text-slate-400"
                        }`}>
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-white truncate pr-2" title={proj.name}>
                            {proj.name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[9px] text-slate-400 font-medium">
                              To {proj.targetLanguage}
                            </span>
                            <span className="text-[9px] text-slate-500">•</span>
                            <span className="text-[9px] text-slate-400">
                              {compCount}/{totalCount} segments
                            </span>
                          </div>

                          {/* Mini Progress Bar */}
                          <div className="mt-2 flex items-center gap-2">
                            <div className="h-1 w-full bg-slate-950 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  pct === 100 ? "bg-emerald-500" : "bg-sky-500"
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-[9px] font-mono font-medium text-slate-400 shrink-0">
                              {pct}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* PDF Upload Card */}
          <div className="glass bg-white/3 border border-white/5 rounded-2xl p-5 shadow-2xl">
            <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-sky-400" />
              Source Document
            </h3>

            {!file ? (
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/10 hover:border-sky-500/50 hover:text-sky-400 bg-white/3 backdrop-blur-md rounded-xl p-8 text-center cursor-pointer transition-all duration-300 group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="application/pdf"
                  className="hidden"
                />
                <UploadCloud className="w-10 h-10 text-slate-500 group-hover:text-sky-400 mx-auto mb-3 transition-colors duration-200" />
                <p className="text-sm font-medium text-slate-300">Drag & drop PDF here</p>
                <p className="text-xs text-slate-500 mt-1">or click to browse local files</p>
              </div>
            ) : (
              <div className="glass bg-white/5 rounded-xl p-4 relative group">
                <button
                  onClick={clearCurrentFile}
                  className="absolute top-2 right-2 p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                  title="Clear file"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="flex items-start gap-3">
                  <div className="bg-red-500/10 text-red-400 p-2 rounded-lg border border-red-500/20 mt-0.5">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate pr-6" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {(file.size / 1024 / 1024).toFixed(2)} MB • {extractedPages.length || "..."} Pages
                    </p>
                  </div>
                </div>

                {/* Parsing indicator */}
                {isParsing && (
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                      <span>Extracting text...</span>
                      <span>
                        {parseProgress.current}/{parseProgress.total} pages
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5">
                      <div
                        className="h-full bg-gradient-to-r from-sky-400 to-indigo-400 transition-all duration-300"
                        style={{
                          width: `${
                            parseProgress.total > 0
                              ? (parseProgress.current / parseProgress.total) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Reference Translation Upload Card */}
          <div className="glass bg-white/3 border border-white/5 rounded-2xl p-5 shadow-2xl">
            <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <Languages className="w-4 h-4 text-emerald-400" />
              Reference Translation <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-slate-400 font-normal">Optional</span>
            </h3>

            {!file ? (
              <div className="border border-dashed border-white/5 bg-white/1 backdrop-blur-md rounded-xl p-6 text-center text-xs text-slate-500">
                Upload source document above to enable aligning reference translations
              </div>
            ) : !referenceFile ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const droppedFile = e.dataTransfer.files[0];
                  if (droppedFile) {
                    processReferenceFile(droppedFile);
                  }
                }}
                onClick={() => refFileInputRef.current?.click()}
                className="border-2 border-dashed border-white/10 hover:border-emerald-500/50 hover:text-emerald-400 bg-white/3 backdrop-blur-md rounded-xl p-6 text-center cursor-pointer transition-all duration-300 group"
              >
                <input
                  type="file"
                  ref={refFileInputRef}
                  onChange={handleRefFileChange}
                  accept="application/pdf,text/html,text/plain"
                  className="hidden"
                />
                <UploadCloud className="w-8 h-8 text-slate-500 group-hover:text-emerald-400 mx-auto mb-2 transition-colors duration-200" />
                <p className="text-xs font-medium text-slate-300">Upload existing translation file</p>
                <p className="text-[10px] text-slate-500 mt-1">Supports PDF, HTML, or TXT</p>
              </div>
            ) : (
              <div className="glass bg-white/5 rounded-xl p-4 relative group">
                <button
                  onClick={clearReferenceFile}
                  className="absolute top-2 right-2 p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                  title="Clear reference file"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="flex items-start gap-3">
                  <div className="bg-emerald-500/10 text-emerald-400 p-2 rounded-lg border border-emerald-500/20 mt-0.5">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate pr-6" title={referenceFile.name}>
                      {referenceFile.name}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 uppercase tracking-wider font-mono text-[10px]">
                      Aligned & Pre-filled
                    </p>
                  </div>
                </div>

                {/* Parsing indicator */}
                {isProcessingRef && (
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                      <span>Analyzing translation...</span>
                      <span>
                        {refParseProgress.current}/{refParseProgress.total} pages
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-300"
                        style={{
                          width: `${
                            refParseProgress.total > 0
                              ? (refParseProgress.current / refParseProgress.total) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Configuration Settings */}
          {showSettings && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass bg-white/3 border border-white/5 rounded-2xl p-5 shadow-2xl space-y-5"
            >
              <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2 border-b border-white/5 pb-3">
                <Sliders className="w-4 h-4 text-sky-400" />
                Translation Settings
              </h3>

              {/* Target Language */}
              <div className="space-y-2">
                <label className="text-[11px] text-slate-400 uppercase tracking-wider font-bold block flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-sky-400" />
                  Target Language
                </label>
                <select
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value)}
                  className="w-full glass bg-slate-950/40 border-white/5 px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-sky-500/50 transition-colors cursor-pointer rounded-lg"
                >
                  <option value="Persian">Persian (Farsi)</option>
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="Arabic">Arabic</option>
                  <option value="German">German</option>
                  <option value="Russian">Russian</option>
                  <option value="Chinese (Simplified)">Chinese (Simplified)</option>
                  <option value="Japanese">Japanese</option>
                  <option value="Portuguese">Portuguese</option>
                  <option value="Italian">Italian</option>
                  <option value="Korean">Korean</option>
                  <option value="Turkish">Turkish</option>
                  <option value="Hindi">Hindi</option>
                </select>
              </div>

              {/* Translation Tone */}
              <div className="space-y-2">
                <label className="text-[11px] text-slate-400 uppercase tracking-wider font-bold block">Preferred Tone</label>
                <div className="grid grid-cols-2 gap-2">
                  {["Professional", "Formal", "Casual", "Literary"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTone(t)}
                      className={`p-2.5 rounded-lg text-xs text-center cursor-pointer font-medium transition-all duration-200 border ${
                        tone === t
                          ? "glass bg-sky-500/10 border-sky-500/40 text-white"
                          : "glass bg-white/3 hover:bg-white/5 border-transparent text-slate-400"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Industry/Glossary Terminology */}
              <div className="space-y-2">
                <label className="text-[11px] text-slate-400 uppercase tracking-wider font-bold block">Specialized Terminology</label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full glass bg-slate-950/40 border-white/5 px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-sky-500/50 transition-colors cursor-pointer rounded-lg"
                >
                  <option value="General">General Context (Standard)</option>
                  <option value="Medical">Medical & Clinical Healthcare</option>
                  <option value="Legal">Legal & Contractual Precision</option>
                  <option value="IT & Software">IT, Tech & Software Engineering</option>
                  <option value="Finance & Business">Corporate Finance & Economics</option>
                  <option value="Engineering">Scientific & Industrial Engineering</option>
                </select>
              </div>

              {/* Model Choice */}
              <div className="space-y-2">
                <label className="text-[11px] text-slate-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-sky-400" />
                  Gemini Translation Engine
                </label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full glass bg-slate-950/40 border-white/5 px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-sky-500/50 transition-colors cursor-pointer rounded-lg"
                >
                  <option value="gemini-2.0-flash">Gemini 2.0 Flash (Default)</option>
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                  <option value="gemini-3.0-flash">Gemini 3.0 Flash</option>
                </select>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  *Uses Flash variants optimized for rapid parallel processing of long document chunks.
                </p>
              </div>

              {/* Document Chunking Parameters */}
              <div className="space-y-3 pt-2 border-t border-white/5">
                <label className="text-[11px] text-slate-300 uppercase tracking-wider font-bold flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-sky-400" />
                  Chunking Parameters
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleChunkSettingsChange("char", charLimit)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                      chunkMode === "char"
                        ? "glass bg-sky-500/10 border-sky-500/40 text-sky-300"
                        : "glass bg-white/3 border-transparent text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    By Character Size
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChunkSettingsChange("page", charLimit)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                      chunkMode === "page"
                        ? "glass bg-sky-500/10 border-sky-500/40 text-sky-300"
                        : "glass bg-white/3 border-transparent text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Page-by-Page
                  </button>
                </div>

                {chunkMode === "char" && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Chunk Size Limit:</span>
                      <span className="font-mono text-white">{charLimit.toLocaleString()} chars</span>
                    </div>
                    <input
                      type="range"
                      min="1500"
                      max="10000"
                      step="500"
                      value={charLimit}
                      onChange={(e) => handleChunkSettingsChange("char", parseInt(e.target.value))}
                      className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-sky-500"
                    />
                    <span className="text-[10px] text-slate-500 block leading-tight">
                      Smaller chunks translate faster; larger chunks yield more cohesive contextual flow.
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Action Trigger Card */}
          {file && extractedPages.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass bg-sky-500/5 border border-sky-500/20 rounded-2xl p-4 shadow-xl"
            >
              <div className="flex items-center justify-between mb-3 text-xs text-sky-300 font-bold uppercase tracking-wider">
                <span>Segments to translate:</span>
                <span className="font-semibold font-mono bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-500/20">
                  {chunks.length} Chunks
                </span>
              </div>
              
              <button
                disabled={isTranslating || isParsing}
                onClick={startTranslation}
                className="w-full bg-sky-500 hover:bg-sky-400 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-sky-500/20 active:scale-[0.98] cursor-pointer"
              >
                {isTranslating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Translating Document...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Translate to {targetLanguage}</span>
                  </>
                )}
              </button>

              {chunks.some((c) => c.status === "failed") && !isTranslating && (
                <button
                  onClick={retryFailedChunks}
                  className="w-full mt-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/20 font-medium py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Failed Chunks</span>
                </button>
              )}
            </motion.div>
          )}
        </div>

        {/* Right Side: Translation Progress & Live Log */}
        <div className={`space-y-6 ${showSettings ? "lg:col-span-8" : "lg:col-span-9 transition-all"}`}>
          {/* Main Workspace Frame (Active status, overall progress, chunk progress tracker) */}
          {(file || chunks.length > 0) && (
            <div className="glass bg-white/3 border border-white/5 rounded-2xl p-6 shadow-2xl space-y-6">
              <div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-lg font-medium text-white flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-sky-400" />
                      Translation Progress
                    </h2>
                    <p className="text-xs text-slate-400">Track real-time translation completion for individual text segments</p>
                  </div>
                  
                  {/* Quick stats badges */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono glass bg-white/5 px-3 py-1.5 rounded-lg text-slate-300 border border-white/5">
                      Completed: <strong className="text-sky-400">{completedChunksCount}</strong>/{chunks.length}
                    </span>
                    {progressPercent === 100 && (
                      <span className="text-xs font-mono bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-emerald-400 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        100% Translated
                      </span>
                    )}
                  </div>
                </div>

                {/* Main Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span>Overall Task Progress</span>
                    <span className="font-mono font-semibold text-white">{progressPercent}%</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5">
                    <div
                      className="h-full bg-gradient-to-r from-sky-400 to-indigo-400 transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Chunk List / Grid tracker */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {chunks.map((chunk) => (
                  <div
                    key={chunk.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      chunk.status === "completed"
                        ? "glass bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40"
                        : chunk.status === "translating"
                        ? "glass bg-sky-500/5 border-sky-500/50 animate-pulse"
                        : chunk.status === "failed"
                        ? "glass bg-red-950/20 border-red-500/40"
                        : "glass bg-white/3 border-white/5"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{chunk.title}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {chunk.text.length.toLocaleString()} characters
                        </p>
                      </div>

                      {/* Status indicator badge */}
                      <div>
                        {chunk.status === "completed" && (
                          <div className="bg-emerald-500/10 text-emerald-400 p-1 rounded-md border border-emerald-500/20" title="Success">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        )}
                        {chunk.status === "translating" && (
                          <div className="bg-sky-500/10 text-sky-400 p-1.5 rounded-md" title="Translating...">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          </div>
                        )}
                        {chunk.status === "failed" && (
                          <div className="bg-red-500/10 text-red-400 p-1 rounded-md border border-red-500/20" title={chunk.error}>
                            <XCircle className="w-4 h-4" />
                          </div>
                        )}
                        {chunk.status === "pending" && (
                          <div className="w-2.5 h-2.5 rounded-full bg-white/10 m-1.5" title="Queued" />
                        )}
                      </div>
                    </div>

                    {/* Progress details */}
                    <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-500 border-t border-white/5 pt-2">
                      <span>Status: <strong className="capitalize text-slate-400">{chunk.status}</strong></span>
                      {chunk.timeTaken && (
                        <span className="font-mono text-sky-400/80">{chunk.timeTaken}s</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Live Activity Log Terminal */}
          <div className="glass bg-white/3 border border-white/5 rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-white/5 border-b border-white/5 px-5 py-3.5 flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2 font-mono">
                <Terminal className="w-4 h-4 text-sky-400" />
                Live Execution Logs
              </h3>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Engine Active</span>
              </div>
            </div>

            {/* Terminal Body */}
            <div className="p-4 h-[180px] overflow-y-auto font-mono text-[11px] leading-relaxed space-y-2 bg-slate-950/40 select-text">
              {logs.length === 0 ? (
                <div className="text-slate-500 italic h-full flex items-center justify-center">
                  Waiting for active translation logs...
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-2 group hover:bg-white/5 px-1 py-0.5 rounded transition-colors">
                    <span className="text-slate-600 select-none">[{log.timestamp}]</span>
                    
                    {/* Log Type Label */}
                    <span
                      className={`font-semibold px-1 rounded text-[9px] uppercase select-none ${
                        log.type === "success"
                          ? "bg-emerald-950/50 text-emerald-400 border border-emerald-500/20"
                          : log.type === "warning"
                          ? "bg-amber-950/50 text-amber-400 border border-amber-500/20"
                          : log.type === "error"
                          ? "bg-red-950/50 text-red-400 border border-red-500/20"
                          : "bg-white/5 text-slate-400 border border-white/5"
                      }`}
                    >
                      {log.type}
                    </span>

                    <span
                      className={`flex-1 ${
                        log.type === "success"
                          ? "text-emerald-300"
                          : log.type === "warning"
                          ? "text-amber-300"
                          : log.type === "error"
                          ? "text-red-300 font-medium"
                          : "text-slate-300"
                      }`}
                    >
                      {log.message}
                    </span>
                  </div>
                ))
              )}
              <div ref={logEndRef} />
            </div>
          </div>

          {/* Translation Viewer & Output Panel */}
          {chunks.some((c) => c.status === "completed") && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass bg-white/3 border border-white/5 rounded-2xl overflow-hidden shadow-2xl"
            >
              {/* Output Top Bar */}
              <div className="bg-white/5 border-b border-white/5 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-sky-400" />
                    Translated Output ({targetLanguage})
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Live-updating side-by-side view as translator segments complete</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-1.5 bg-slate-950/50 hover:bg-slate-900/50 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer"
                    title="Copy full translation"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{isCopied ? "Copied!" : "Copy"}</span>
                  </button>

                  <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block" />

                  {/* Dropdown / Export options */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={downloadMarkdown}
                      className="flex items-center gap-1 bg-sky-500 hover:bg-sky-400 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shadow-md shadow-sky-500/10"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>MD</span>
                    </button>
                    <button
                      onClick={downloadTxt}
                      className="flex items-center gap-1 bg-sky-500 hover:bg-sky-400 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shadow-md shadow-sky-500/10"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>TXT</span>
                    </button>
                    <button
                      onClick={downloadHtmlAsPdfGuide}
                      className="flex items-center gap-1 bg-sky-500 hover:bg-sky-400 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shadow-md shadow-sky-500/10"
                      title="Generate clean printable layout with native PDF export"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>PDF Document</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Side-by-side or stacked grid view of text panels */}
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/5">
                {/* Original Pane */}
                <div className="p-6 bg-slate-950/10 space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-medium pb-2 border-b border-white/5">
                    <span>Original Document (English / Auto)</span>
                    <span className="font-mono bg-white/5 border border-white/5 px-2 py-0.5 rounded text-[10px]">LTR</span>
                  </div>
                  <div className="max-h-[500px] overflow-y-auto text-sm text-slate-300 whitespace-pre-line leading-relaxed pr-2 font-serif select-text scrollbar-thin">
                    {getFullOriginal()}
                  </div>
                </div>

                {/* Translated Pane (Supports RTL automatically) */}
                <div className="p-6 bg-slate-950/20 space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-medium pb-2 border-b border-white/5">
                    <span>Target Translation ({targetLanguage})</span>
                    <span className="font-mono bg-white/5 border border-white/5 px-2 py-0.5 rounded text-[10px] uppercase">
                      {["Persian", "Arabic", "Hebrew", "Urdu"].includes(targetLanguage) ? "RTL" : "LTR"}
                    </span>
                  </div>
                  <div
                    dir={["Persian", "Arabic", "Hebrew", "Urdu"].includes(targetLanguage) ? "rtl" : "ltr"}
                    className={`max-h-[500px] overflow-y-auto text-sm text-slate-200 whitespace-pre-line leading-relaxed pl-2 font-serif select-text scrollbar-thin ${
                      ["Persian", "Arabic", "Hebrew", "Urdu"].includes(targetLanguage) 
                        ? "font-sans font-normal" 
                        : "font-serif"
                    }`}
                  >
                    {getFullTranslation()}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </main>
  );
}

