import JSZip from 'jszip';

/**
 * Extracts raw text and basic paragraph lists from a Word .docx file.
 * Completely offline and uses jszip.
 */
export async function extractTextFromDocx(file) {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  const docXml = await zip.file("word/document.xml").async("text");
  
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(docXml, "text/xml");
  const paragraphs = xmlDoc.getElementsByTagName("w:p");
  
  const result = [];
  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i];
    const textRuns = p.getElementsByTagName("w:t");
    let pText = "";
    for (let j = 0; j < textRuns.length; j++) {
      pText += textRuns[j].textContent;
    }
    
    // Simple list bullet indicator detection
    const numPr = p.getElementsByTagName("w:numPr");
    if (numPr.length > 0 && pText.trim()) {
      pText = "- " + pText.trim();
    }
    
    result.push(pText);
  }
  return result.join("\n");
}

/**
 * Extracts text from PDF files using PDF.js.
 * Dynamically loads the library from CDN, with an offline fallback error.
 */
export async function extractTextFromPdf(file) {
  return new Promise((resolve, reject) => {
    // If already loaded in window
    if (window.pdfjsLib) {
      runPdfExtractor(window.pdfjsLib, file, resolve, reject);
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
      script.onload = () => {
        // PDF.js structure inside window
        const pdfjsLib = window['pdfjs-dist/build/pdf'];
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
        runPdfExtractor(pdfjsLib, file, resolve, reject);
      };
      script.onerror = () => {
        reject(new Error("Failed to load PDF parsing engine. Please check your internet connection or upload a Word (.docx) document instead."));
      };
      document.head.appendChild(script);
    }
  });
}

function runPdfExtractor(pdfjsLib, file, resolve, reject) {
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const typedarray = new Uint8Array(e.target.result);
      const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
      let fullText = "";
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        let lastY = -1;
        let pageText = "";
        
        for (let item of textContent.items) {
          // When vertical Y position shifts by a threshold, treat as a new paragraph
          if (lastY !== -1 && Math.abs(item.transform[5] - lastY) > 6) {
            pageText += "\n";
          }
          pageText += item.str;
          lastY = item.transform[5];
        }
        
        fullText += pageText;
        if (i < pdf.numPages) {
          fullText += "\n<!-- pagebreak -->\n";
        }
      }
      resolve(fullText.trim());
    } catch (err) {
      reject(new Error("Failed to extract text from PDF file: " + err.message));
    }
  };
  reader.readAsArrayBuffer(file);
}
