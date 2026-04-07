'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

export default function RichTextEditor({ value, onChange, placeholder = 'أدخل النص...', rows = 6 }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'visual' | 'html'>('visual');
  const [activeFormats, setActiveFormats] = useState<Record<string, boolean>>({});
  const [currentDir, setCurrentDir] = useState<'rtl' | 'ltr'>('rtl');

  useEffect(() => {
    if (editorRef.current && value && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  useEffect(() => {
    const updateFormats = () => {
      if (!editorRef.current?.contains(document.activeElement)) return;
      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        ol: document.queryCommandState('insertOrderedList'),
        ul: document.queryCommandState('insertUnorderedList'),
      });
    };
    document.addEventListener('selectionchange', updateFormats);
    return () => document.removeEventListener('selectionchange', updateFormats);
  }, []);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const execCommand = useCallback((command: string, value?: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    
    const selection = window.getSelection();
    let savedRange: Range | null = null;
    if (selection && !selection.isCollapsed) {
      savedRange = selection.getRangeAt(0).cloneRange();
    }
    
    try {
      document.execCommand(command, false, value);
      
      if (savedRange) {
        selection?.removeAllRanges();
        selection?.addRange(savedRange);
      }
      
      handleInput();
    } catch (e) {
      console.error('Command error:', command, e);
    }
  }, [handleInput]);

  const applyHeading = (tag: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    
    editor.focus();
    const selection = window.getSelection();
    
    if (selection && !selection.isCollapsed && selection.toString().length > 0) {
      const range = selection.getRangeAt(0);
      
      // Get the current direction from the selection or parent
      let currentDir = 'rtl';
      if (range.startContainer.nodeType === Node.TEXT_NODE) {
        const parent = range.startContainer.parentElement;
        if (parent) {
          const dir = parent.getAttribute('dir') || getComputedStyle(parent).direction;
          if (dir === 'ltr') currentDir = 'ltr';
        }
      }
      
      // Create heading element preserving direction
      const heading = document.createElement(tag);
      heading.setAttribute('dir', currentDir);
      
      // Extract contents while preserving formatting
      const fragment = range.extractContents();
      heading.appendChild(fragment);
      
      range.insertNode(heading);
      
      // Restore selection to cover the heading
      range.setStartAfter(heading);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      // No selection - use formatBlock
      document.execCommand('formatBlock', false, tag);
    }
    
    handleInput();
  };

  const changeDirection = (dir: 'rtl' | 'ltr') => {
    const editor = editorRef.current;
    if (!editor) return;
    
    editor.focus();
    const selection = window.getSelection();
    
    if (selection && !selection.isCollapsed && selection.toString().trim().length > 0) {
      const range = selection.getRangeAt(0);
      
      // Use bdo element for bidirectional text direction
      const bdo = document.createElement('bdo');
      bdo.setAttribute('dir', dir);
      bdo.style.direction = dir;
      bdo.style.display = 'inline';
      bdo.style.unicodeBidi = 'bidi-override';
      
      try {
        range.surroundContents(bdo);
      } catch (e) {
        const fragment = range.extractContents();
        bdo.appendChild(fragment);
        range.insertNode(bdo);
      }
      
      range.setStartAfter(bdo);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      editor.setAttribute('dir', dir);
      editor.style.direction = dir;
    }
    
    setCurrentDir(dir);
    handleInput();
  };

  const setAlignment = (align: string) => execCommand(`justify${align}`);

  const isActive = (key: string) => !!activeFormats[key];

  const ToolbarBtn = ({ active, onClick, title, children }: { active?: boolean; onClick: () => void; title: string; children: React.ReactNode }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`w-8 h-8 flex items-center justify-center rounded transition-all text-sm font-bold
        ${active ? 'bg-luxury-gold text-luxury-black' : 'text-gray-300 hover:bg-luxury-gold/30 hover:text-luxury-gold'}`}
    >
      {children}
    </button>
  );

  return (
    <div className="border border-luxury-gold/20 rounded-sm overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-luxury-black border-b border-luxury-gold/20">
        <ToolbarBtn active={isActive('bold')} onClick={() => execCommand('bold')} title="عريض (Bold)">B</ToolbarBtn>
        <ToolbarBtn active={isActive('italic')} onClick={() => execCommand('italic')} title="مائل (Italic)"><span className="italic">I</span></ToolbarBtn>
        <ToolbarBtn active={isActive('underline')} onClick={() => execCommand('underline')} title="تحته خط (Underline)"><span className="underline">U</span></ToolbarBtn>

        <div className="w-px h-6 bg-gray-600 mx-1" />

        {/* Heading buttons */}
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => applyHeading('h1')}
            title="عنوان كبير (H1)"
            className="h-8 px-2 flex items-center justify-center rounded transition-all text-xs font-bold text-gray-300 hover:bg-luxury-gold/30 hover:text-luxury-gold"
          >
            H1
          </button>
          <button
            type="button"
            onClick={() => applyHeading('h2')}
            title="عنوان متوسط (H2)"
            className="h-8 px-2 flex items-center justify-center rounded transition-all text-xs font-bold text-gray-300 hover:bg-luxury-gold/30 hover:text-luxury-gold"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => applyHeading('h3')}
            title="عنوان صغير (H3)"
            className="h-8 px-2 flex items-center justify-center rounded transition-all text-xs font-bold text-gray-300 hover:bg-luxury-gold/30 hover:text-luxury-gold"
          >
            H3
          </button>
          <button
            type="button"
            onClick={() => applyHeading('p')}
            title="فقرة عادية"
            className="h-8 px-2 flex items-center justify-center rounded transition-all text-xs font-bold text-gray-300 hover:bg-luxury-gold/30 hover:text-luxury-gold"
          >
            نص
          </button>
        </div>

        <div className="w-px h-6 bg-gray-600 mx-1" />

        <ToolbarBtn active={isActive('ol')} onClick={() => execCommand('insertOrderedList')} title="قائمة مرقمة">1.</ToolbarBtn>
        <ToolbarBtn active={isActive('ul')} onClick={() => execCommand('insertUnorderedList')} title="قائمة بنقاط">•</ToolbarBtn>

        <div className="w-px h-6 bg-gray-600 mx-1" />

        <ToolbarBtn onClick={() => setAlignment('Left')} title="محاذاة لليسار">←</ToolbarBtn>
        <ToolbarBtn onClick={() => setAlignment('Center')} title="محاذاة للوسط">↔</ToolbarBtn>
        <ToolbarBtn onClick={() => setAlignment('Right')} title="محاذاة لليمين">→</ToolbarBtn>

        <div className="w-px h-6 bg-gray-600 mx-1" />

        {/* Direction buttons */}
        <button
          type="button"
          onClick={() => changeDirection('rtl')}
          title="عربي - للسطور المحددة أو الكل"
          className={`h-8 px-3 flex items-center justify-center rounded transition-all text-xs font-bold border ${
            currentDir === 'rtl' 
              ? 'bg-luxury-gold text-luxury-black border-luxury-gold' 
              : 'bg-luxury-gold/10 text-luxury-gold border-luxury-gold/30 hover:bg-luxury-gold/30'
          }`}
        >
          عربـي ←
        </button>
        <button
          type="button"
          onClick={() => changeDirection('ltr')}
          title="English - للسطور المحددة أو الكل"
          className={`h-8 px-3 flex items-center justify-center rounded transition-all text-xs font-bold border ${
            currentDir === 'ltr' 
              ? 'bg-luxury-gold text-luxury-black border-luxury-gold' 
              : 'bg-luxury-gold/10 text-luxury-gold border-luxury-gold/30 hover:bg-luxury-gold/30'
          }`}
        >
          English →
        </button>

        <div className="w-px h-6 bg-gray-600 mx-1" />

        <button
          type="button"
          onClick={() => setViewMode(v => v === 'visual' ? 'html' : 'visual')}
          className="h-8 px-3 flex items-center justify-center text-gray-300 hover:bg-luxury-gold/30 hover:text-luxury-gold rounded transition-all text-xs"
        >
          {viewMode === 'visual' ? 'كود' : 'مرئي'}
        </button>
      </div>

      <style jsx global>{`
        [contenteditable] ul, [contenteditable] ol { margin: 10px 0; padding-right: 20px; list-style-type: disc; }
        [contenteditable] ol { list-style-type: decimal; }
        [contenteditable] li { margin: 5px 0; }
        [contenteditable] h1 { font-size: 24px; font-weight: bold; margin: 15px 0 10px 0; }
        [contenteditable] h2 { font-size: 20px; font-weight: bold; margin: 12px 0 8px 0; }
        [contenteditable] h3 { font-size: 16px; font-weight: bold; margin: 10px 0 6px 0; }
        [contenteditable] p { margin: 8px 0; }
      `}</style>

      {viewMode === 'visual' ? (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          className="w-full min-h-[150px] p-4 bg-luxury-black text-white focus:outline-none"
          style={{ minHeight: `${rows * 24}px`, outline: 'none' }}
          dir="auto"
        />
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full min-h-[150px] p-4 bg-luxury-black text-white focus:outline-none font-mono text-sm"
          style={{ minHeight: `${rows * 24}px` }}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}
