import React from 'react';
import { Upload, Plus, FileText, Trash2, Edit2, Play, Menu, FileCode } from 'lucide-react';
import { extractTextFromDocx, extractTextFromPdf } from '../lib/docxPdfParser';

export default function CustomTemplatesList({
  templates,
  onSelectTemplate,
  onEditTemplate,
  onDeleteTemplate,
  onCreateBlank,
  onUploadTemplate,
  onImportLibrary,
  sidebarCollapsed,
  toggleSidebarCollapse,
}) {
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const name = file.name.replace(/\.[^/.]+$/, ""); // Strip extension
    const ext = file.name.split('.').pop().toLowerCase();
    
    try {
      let text = "";
      if (ext === 'docx') {
        text = await extractTextFromDocx(file);
      } else if (ext === 'pdf') {
        text = await extractTextFromPdf(file);
      } else {
        // Fallback for txt, md, etc.
        text = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target.result);
          reader.onerror = (err) => reject(err);
          reader.readAsText(file);
        });
      }
      onUploadTemplate(name, text);
    } catch (err) {
      alert("Error uploading template: " + err.message);
    }
    e.target.value = ''; // Reset input
  };

  const handleExportLibrary = () => {
    const userCreated = templates.filter(t => t.id !== 'default-memo');
    if (userCreated.length === 0) {
      return alert("No custom templates to export. Create or upload some templates first!");
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(userCreated, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "custom-templates-library.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJsonFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        const array = Array.isArray(imported) ? imported : [imported];
        
        // Basic schema check
        const valid = array.every(item => item.name && item.body);
        if (!valid) {
          return alert("Invalid file contents. The file must contain valid templates with 'name' and 'body' fields.");
        }

        onImportLibrary(array);
        alert(`Successfully imported ${array.length} templates!`);
      } catch (err) {
        alert("Error parsing template JSON: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset
  };

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
      
      {/* Header bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '1rem 1.25rem',
        boxShadow: 'var(--shadow-sm)',
        width: '100%',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {sidebarCollapsed && toggleSidebarCollapse && (
            <button 
              type="button" 
              onClick={toggleSidebarCollapse}
              className="btn-action-outline no-print"
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.7rem', fontWeight: '700', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Menu size={12} /> Sidebar
            </button>
          )}
          <div>
            <h2 style={{ fontSize: '0.95rem', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>Custom Document Templates</h2>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: 0, marginTop: '2px' }}>
              Upload text layouts or import shared template libraries from JSON.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <input 
            type="file" 
            accept=".txt,.md,.docx,.pdf" 
            id="template-upload-file" 
            onChange={handleFileChange} 
            style={{ display: 'none' }}
          />
          <input 
            type="file" 
            accept=".json" 
            id="template-import-json-file" 
            onChange={handleImportJsonFile} 
            style={{ display: 'none' }}
          />
          <button 
            type="button"
            onClick={() => document.getElementById('template-upload-file').click()}
            className="btn-action-outline"
            style={{ padding: '0.5rem 0.85rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Upload size={13} /> Upload Template (.docx, .pdf, .txt)
          </button>
          <button 
            type="button"
            onClick={() => document.getElementById('template-import-json-file').click()}
            className="btn-action-outline"
            style={{ padding: '0.5rem 0.85rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
            title="Import library from custom-templates-library.json file"
          >
            📥 Import Library (.json)
          </button>
          <button 
            type="button"
            onClick={handleExportLibrary}
            className="btn-action-outline"
            style={{ padding: '0.5rem 0.85rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
            title="Export all custom templates as a single backup JSON file"
          >
            📤 Export Library
          </button>
          <button 
            type="button"
            onClick={onCreateBlank}
            className="btn-action-primary"
            style={{ padding: '0.5rem 0.85rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Plus size={13} /> Create Blank
          </button>
        </div>
      </div>

      {/* Template Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '1.25rem',
        width: '100%'
      }}>
        {templates.map(tmpl => {
          // Count placeholders in body
          const regex = /\{\{\s*(.*?)\s*\}\}/g;
          const matches = [];
          let match;
          while ((match = regex.exec(tmpl.body || '')) !== null) {
            const placeholder = match[1].trim();
            if (!matches.includes(placeholder)) matches.push(placeholder);
          }

          // Create excerpt
          const excerpt = tmpl.body 
            ? tmpl.body.substring(0, 140).replace(/[\n\r]+/g, ' ') + (tmpl.body.length > 140 ? '...' : '') 
            : 'Empty template content...';

          return (
            <div 
              key={tmpl.id} 
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1rem',
                boxShadow: 'var(--shadow-sm)',
                transition: 'var(--transition)',
                position: 'relative',
                overflow: 'hidden'
              }}
              className="history-card"
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      background: 'rgba(99, 102, 241, 0.1)',
                      color: 'var(--accent-primary)',
                      padding: '6px',
                      borderRadius: '6px'
                    }}>
                      <FileCode size={16} />
                    </div>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '170px' }} title={tmpl.name}>
                      {tmpl.name}
                    </strong>
                  </div>
                  {tmpl.id !== 'default-memo' && (
                    <span style={{ fontSize: '0.6rem', color: 'var(--accent-primary)', background: 'rgba(99, 102, 241, 0.1)', padding: '2px 6px', borderRadius: '4px', fontWeight: '600' }}>
                      Custom
                    </span>
                  )}
                </div>

                <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: '1.4', margin: 0, minHeight: '3.6em' }}>
                  {excerpt}
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                  <span style={{ fontSize: '0.65rem', background: 'rgba(99, 102, 241, 0.08)', color: 'var(--accent-primary)', padding: '2px 6px', borderRadius: '4px', fontWeight: '500' }}>
                    {matches.length} Dynamic {matches.length === 1 ? 'Field' : 'Fields'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                <button 
                  type="button" 
                  onClick={() => onSelectTemplate(tmpl)}
                  className="btn-action-primary"
                  style={{ flex: 1.5, padding: '0.45rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                >
                  <Play size={11} /> Use Template
                </button>
                <button 
                  type="button" 
                  onClick={() => onEditTemplate(tmpl)}
                  className="btn-action-outline"
                  style={{ flex: 1, padding: '0.45rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                >
                  <Edit2 size={11} /> Edit Text
                </button>
                {tmpl.id !== 'default-memo' && (
                  <button 
                    type="button" 
                    onClick={() => onDeleteTemplate(tmpl.id)}
                    className="btn-action-outline btn-action-danger"
                    style={{ padding: '0.45rem' }}
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Dynamic Placeholder Guide Banner */}
      <div style={{
        background: 'rgba(99, 102, 241, 0.04)',
        border: '1px dashed rgba(99, 102, 241, 0.2)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem',
        color: 'var(--text-secondary)',
        fontSize: '0.75rem',
        lineHeight: '1.5'
      }}>
        <h4 style={{ color: 'var(--text-primary)', margin: '0 0 0.5rem 0', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
          💡 Guide: Creating Custom Templates
        </h4>
        <p style={{ margin: '0 0 0.25rem 0' }}>
          You can write templates using variables enclosed in double curly braces, such as <code>{`{{Employee Name}}`}</code> or <code>{`{{Position}}`}</code>.
        </p>
        <p style={{ margin: '0' }}>
          When loaded, the app will automatically scan for these placeholders, generate convenient inputs in the left sidebar, and replace them in the live A4 preview window.
        </p>
      </div>

    </div>
  );
}
