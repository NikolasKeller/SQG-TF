import { NextRequest, NextResponse } from 'next/server'
import { processPDF } from '@/lib/pdfUtils'
import { extractTextFromPDF } from '@/lib/pdf-utils'
import { findRelevantContext } from '@/lib/search-utils'

export async function POST(request: Request) {
  try {
    console.log('API route: Processing request');
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const requirements = formData.get('requirements') as string;
    
    if (!file) {
      console.error('No file provided');
      return NextResponse.json({ 
        technical_details: 'Keine Datei hochgeladen',
        success: false
      }, { status: 400 });
    }

    console.log('File received:', file.name, 'Size:', file.size, 'Type:', file.type);
    console.log('Requirements:', requirements);
    
    // Überprüfe, ob es sich um eine PDF-Datei handelt
    if (!file.type.includes('pdf')) {
      return NextResponse.json({ 
        technical_details: 'Die hochgeladene Datei ist keine PDF-Datei',
        success: false
      }, { status: 400 });
    }
    
    try {
      // Konvertiere File zu ArrayBuffer und dann zu Buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      console.log('Buffer created, size:', buffer.length);
      
      // Extrahiere Text aus PDF
      const pdfText = await extractTextFromPDF(buffer);
      
      if (!pdfText || pdfText.length === 0) {
        return NextResponse.json({ 
          technical_details: 'Keine Textdaten aus der PDF-Datei extrahiert',
          success: false
        });
      }
      
      console.log('PDF text extracted, length:', pdfText.length);
      
      // Verarbeite die Anforderungen
      const keywords = requirements
        .split('\n')
        .map(k => k.trim())
        .filter(k => k.length > 0);
      
      console.log('Keywords:', keywords);
      
      // Einfache Textsuche
      const results = keywords.map(keyword => {
        if (!keyword) return `Leeres Keyword`;
        
        // Teile den Text in Sätze
        const sentences = pdfText.split(/[.!?]\s+/)
          .map(s => s.trim())
          .filter(s => s.length > 10);
        
        // Suche nach dem Keyword in jedem Satz
        const matches = sentences.filter(sentence => 
          sentence.toLowerCase().includes(keyword.toLowerCase())
        );
        
        if (matches.length === 0) {
          return `Keine Treffer für: "${keyword}"`;
        }
        
        // Formatiere die Ergebnisse
        return `Keyword: "${keyword}"\n${matches.join('\n')}`;
      });
      
      // Stelle sicher, dass wir ein gültiges JSON-Objekt zurückgeben
      return NextResponse.json({
        technical_details: results.join('\n\n'),
        success: true
      });
      
    } catch (pdfError) {
      console.error('PDF processing error:', pdfError);
      return NextResponse.json({ 
        technical_details: `Fehler bei der PDF-Verarbeitung: ${pdfError.message}`,
        success: false
      });
    }
  } catch (error) {
    console.error('General error:', error);
    // Stelle sicher, dass wir ein gültiges JSON-Objekt zurückgeben
    return NextResponse.json({ 
      technical_details: error instanceof Error ? error.message : 'Fehler bei der Verarbeitung',
      success: false
    });
  }
}

function formatText(text: string, maxLength: number): string {
  // Entferne überschüssige Leerzeichen
  const cleanText = text.replace(/\s+/g, ' ').trim();
  
  // Prüfe auf Referenznummern am Anfang
  const refMatch = cleanText.match(/^(\d+[-\s]*\d*\s+(?:Seite\s+\d+\s+\/\s+)?\d+)/);
  const reference = refMatch ? refMatch[1] + '\n' : '';
  const remainingText = refMatch ? cleanText.slice(refMatch[1].length).trim() : cleanText;

  const words = remainingText.split(' ');
  const lines = [];
  let currentLine = '';
  
  for (const word of words) {
    if ((currentLine + ' ' + word).length <= maxLength) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return reference + lines.join('\n');
}

function extractRelevantSection(pdfText: string, keyword: string): string {
  // Teile den Text in Zeilen
  const lines = pdfText.split('\n');
  
  // Finde die Zeile mit dem Keyword
  let keywordLineIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(keyword)) {
      keywordLineIndex = i;
      console.log('Keyword gefunden in Zeile:', i);
      break;
    }
  }
  
  if (keywordLineIndex === -1) {
    console.log('Keyword nicht gefunden');
    return '';
  }

  // Liste bekannter Überschriften
  const knownHeadings = [
    'Prozessdatenschnittstellen / –aufzeichnung',
    'Wärmerückgewinnung (WRG) ECO-HEAT',
    'Anlagensteuerung und Automatisierung',
    'Montage- / Inbetriebnahmekosten',
    'Auslass Spannrahmen',
    'Steuerung und Visualisierung'
  ];

  // Suche rückwärts nach der letzten Überschrift
  let startIndex = -1;
  for (let i = keywordLineIndex; i >= 0; i--) {
    if (knownHeadings.some(heading => lines[i].includes(heading))) {
      startIndex = i;
      console.log('Start-Überschrift gefunden:', lines[i]);
      break;
    }
  }

  // Suche vorwärts nach der nächsten Überschrift
  let endIndex = -1;
  for (let i = keywordLineIndex + 1; i < lines.length; i++) {
    if (knownHeadings.some(heading => lines[i].includes(heading))) {
      endIndex = i;
      console.log('End-Überschrift gefunden:', lines[i]);
      break;
    }
  }

  if (startIndex === -1 || endIndex === -1) {
    console.log('Keine umschließenden Überschriften gefunden');
    return '';
  }

  // Extrahiere den Text zwischen den Überschriften
  const relevantText = lines.slice(startIndex, endIndex).join('\n').trim();
  console.log('Extrahierter Text:', relevantText);
  
  return relevantText;
}

function containsBoldText(line: string): boolean {
  // Prüfe auf typische Merkmale von Fettdruck in PDFs:
  // 1. Wiederholte Zeichen direkt hintereinander
  // 2. Großgeschriebene Wörter mit bestimmten Formatierungen
  // 3. Spezielle Überschriften-Patterns
  
  // Entferne Zahlen und Sonderzeichen für die Prüfung
  const cleanLine = line.trim().replace(/[\d\.\-\/\(\)]/g, '').trim();
  
  return (
    // Prüfe auf Überschriften-Format
    /^[A-Z][A-Z\s]+$/.test(cleanLine) || // Komplett großgeschriebene Wörter
    /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s*(?:\/|und)\s+[A-Z][a-z]+/.test(line) || // Format wie "Montage- / Inbetriebnahmekosten"
    line.includes('ECO-HEAT') || // Spezielle Keywords
    /^[A-Z][A-Z\s\-]+(?:\s*\/\s*[–A-Z\s\-]+)?$/.test(line) // Prozessdatenschnittstellen / -aufzeichnung Format
  );
}

// OPTIONS-Handler für CORS-Preflight
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 })
  response.headers.set('Access-Control-Allow-Origin', 'http://localhost:3001')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
  
  return response
} 