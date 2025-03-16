import pdfParse from 'pdf-parse';

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    console.log('Starting PDF extraction with pdf-parse');
    
    // Überprüfe, ob der Buffer gültig ist
    if (!buffer || buffer.length === 0) {
      throw new Error('Leerer Buffer wurde übergeben');
    }
    
    // Einfache Prüfung, ob es sich um eine PDF-Datei handelt
    if (buffer.slice(0, 5).toString() !== '%PDF-') {
      throw new Error('Die Datei scheint keine gültige PDF-Datei zu sein (fehlendes PDF-Header)');
    }
    
    // Optionen für pdf-parse
    const options = {
      // Maximale Anzahl von Seiten, die verarbeitet werden sollen
      max: 0, // 0 = alle Seiten
      // Unterdrücke Fehler bei der Verarbeitung
      suppressErrors: true
    };
    
    console.log('Calling pdf-parse with buffer size:', buffer.length);
    
    try {
      const data = await pdfParse(buffer, options);
      
      if (!data || !data.text) {
        throw new Error('Keine Textdaten aus PDF extrahiert');
      }
      
      console.log('PDF extraction complete, text length:', data.text.length);
      console.log('Sample text:', data.text.substring(0, 100) + '...');
      
      return data.text;
    } catch (parseError) {
      console.error('PDF parse error:', parseError);
      throw new Error(`PDF parsing failed: ${parseError.message}`);
    }
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error(`PDF extraction failed: ${error.message}`);
  }
} 