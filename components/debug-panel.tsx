"use client"

import { useState } from "react"
import { FiUpload, FiSearch, FiFileText, FiAlertCircle, FiCheckCircle, FiArrowRight, FiDownload } from 'react-icons/fi'
import DryftLogo from './logo'

export default function DebugPanel() {
  const [file, setFile] = useState<File | null>(null);
  const [requirements, setRequirements] = useState('');
  const [result, setResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(1);
  const [showFinalQuote, setShowFinalQuote] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      setFile(selectedFile);
      setActiveStep(2); // Automatisch zum nächsten Schritt wechseln
      console.log('File selected:', selectedFile.name, 'Size:', selectedFile.size, 'Type:', selectedFile.type);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      const droppedFile = event.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
        setActiveStep(2); // Automatisch zum nächsten Schritt wechseln
      } else {
        setError('Bitte nur PDF-Dateien hochladen');
      }
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const processRequirements = async () => {
    if (!file || !requirements) {
      setError('Bitte wähle eine Datei aus und gib Suchbegriffe ein');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Entferne führende Schrägstriche, Bindestriche und andere Sonderzeichen von den Keywords
      const cleanedRequirements = requirements
        .split('\n')
        .map(line => line.trim().replace(/^[\/\-\+\*]+/, '').trim())
        .filter(line => line.length > 0)
        .join('\n');
      
      console.log('Processing file:', file.name);
      console.log('Requirements:', cleanedRequirements);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('requirements', cleanedRequirements);
      
      const response = await fetch('/api/process', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.technical_details || 'Unbekannter Fehler bei der Verarbeitung');
      }
      
      if (!data.success) {
        throw new Error(data.technical_details || 'Die Verarbeitung war nicht erfolgreich');
      }
      
      setResult(data.technical_details || 'Keine technischen Details gefunden');
      setShowFinalQuote(true);

    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Fehler bei der Verarbeitung');
      setResult('');
    } finally {
      setIsLoading(false);
    }
  };

  const resetProcess = () => {
    setShowFinalQuote(false);
    setFile(null);
    setRequirements('');
    setResult('');
    setActiveStep(1);
  };

  // Verbesserte Funktion zur Formatierung der Ergebnisse
  const formatResults = () => {
    if (!result) return [];
    
    return result.split('\n\n').map(section => {
      const [header, ...content] = section.split('\n');
      
      if (header.startsWith('Keyword:')) {
        const keyword = header.replace('Keyword:', '').trim().replace(/"/g, '');
        
        // Filtere nur die Zeilen, die das Keyword enthalten
        const relevantContent = content.filter(line => 
          line.toLowerCase().includes(keyword.toLowerCase())
        );
        
        // Bestimme den Hauptkontext für dieses Keyword
        let mainContext = determineMainContext(keyword, relevantContent);
        
        return {
          type: 'match',
          keyword,
          context: mainContext,
          content: relevantContent
        };
      } else if (header.startsWith('Keine Treffer')) {
        const keyword = header.match(/für: "([^"]+)"/)?.[1] || '';
        return {
          type: 'no-match',
          keyword
        };
      } else {
        return {
          type: 'other',
          content: section
        };
      }
    });
  };
  
  // Hilfsfunktion zur Bestimmung des Hauptkontexts für ein Keyword
  const determineMainContext = (keyword, relevantContent) => {
    // Spezifische Kontexte für verschiedene Keywords
    const keywordContexts = {
      'wärmerückgewinnung': 'Wärmerückgewinnung (WRG) ECO-HEAT',
      'eco-heat': 'Wärmerückgewinnung (WRG) ECO-HEAT',
      'einlaufständer': 'Transportsystem POWER-FRAME',
      'baumwolle': 'Allgemeine technische Daten'
    };
    
    // Prüfe, ob wir einen vordefinierten Kontext für dieses Keyword haben
    const lowerKeyword = keyword.toLowerCase();
    if (keywordContexts[lowerKeyword]) {
      return keywordContexts[lowerKeyword];
    }
    
    // Versuche, einen Kontext aus dem Inhalt zu extrahieren
    for (const line of relevantContent) {
      // Suche nach typischen Überschriften
      if (line.includes('ECO-HEAT') && line.includes('WRG')) {
        return 'Wärmerückgewinnung (WRG) ECO-HEAT';
      }
      if (line.includes('Transportsystem') && line.includes('POWER-FRAME')) {
        return 'Transportsystem POWER-FRAME';
      }
      if (line.includes('Allgemeine technische Daten')) {
        return 'Allgemeine technische Daten';
      }
    }
    
    // Fallback: Verwende das Keyword als Kontext
    return keyword.charAt(0).toUpperCase() + keyword.slice(1);
  };

  // Vollständiger Ladebildschirm
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50">
        <div className="w-24 h-24 border-t-4 border-blue-500 border-solid rounded-full animate-spin mb-6"></div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Generiere Angebot</h2>
        <p className="text-gray-500">Bitte warten, während wir dein Angebot erstellen...</p>
      </div>
    );
  }

  // Finale Angebotsseite mit verbesserter Ergebnisdarstellung
  if (showFinalQuote) {
    const formattedResults = formatResults();
    
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <DryftLogo className="w-10 h-10 mr-3" />
            <h1 className="text-2xl font-bold text-gray-800">Dryft</h1>
          </div>
          <button 
            onClick={resetProcess}
            className="text-blue-500 hover:text-blue-700 flex items-center"
          >
            <FiArrowRight className="mr-2 transform rotate-180" /> Zurück zum Start
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Final Quote</h2>
            <button className="flex items-center text-blue-500 hover:text-blue-700">
              <FiDownload className="mr-2" /> Als PDF exportieren
            </button>
          </div>
          
          <div className="mb-6">
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="bg-gray-100 px-4 py-2 rounded-md">
                <p className="text-sm text-gray-500">Datei</p>
                <p className="font-medium">{file?.name}</p>
              </div>
              <div className="bg-gray-100 px-4 py-2 rounded-md">
                <p className="text-sm text-gray-500">Größe</p>
                <p className="font-medium">{file ? `${Math.round(file.size / 1024)} KB` : '-'}</p>
              </div>
              <div className="bg-gray-100 px-4 py-2 rounded-md">
                <p className="text-sm text-gray-500">Suchbegriffe</p>
                <p className="font-medium">{requirements.split('\n').filter(r => r.trim()).length}</p>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-4 text-gray-700">Extrahierte Informationen</h3>
            
            <div className="bg-gray-50 rounded-md p-4 max-h-[500px] overflow-y-auto">
              {formattedResults.map((item, index) => {
                if (item.type === 'match') {
                  return (
                    <div key={index} className="mb-8 last:mb-0">
                      <div className="mb-2 text-sm text-blue-600 font-medium">
                        Suchbegriff: {item.keyword}
                      </div>
                      
                      <div className="mb-6 last:mb-0 bg-white p-4 rounded-md border border-gray-200">
                        <h4 className="font-bold text-gray-800 mb-2 pb-2 border-b border-gray-100">
                          {item.context}
                        </h4>
                        <div className="pl-4 border-l-2 border-blue-200">
                          {item.content.map((line, j) => (
                            <p key={j} className="mb-2 text-gray-700">{line}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                } else if (item.type === 'no-match') {
                  return (
                    <div key={index} className="mb-6 last:mb-0">
                      <div className="mb-2 text-sm text-gray-600 font-medium">
                        Suchbegriff: {item.keyword}
                      </div>
                      <p className="text-gray-500 italic pl-4">Keine Treffer in der PDF-Datei gefunden</p>
                    </div>
                  );
                } else {
                  return (
                    <p key={index} className="mb-2">{item.content}</p>
                  );
                }
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Hauptprozess-UI
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <DryftLogo className="w-10 h-10 mr-3" />
          <h1 className="text-2xl font-bold text-gray-800">Dryft</h1>
        </div>
      </div>
      
      <h2 className="text-xl font-bold mb-8 text-gray-700">Sales Quote Generation</h2>
      
      {/* Fortschrittsanzeige */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
              activeStep >= 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              1
            </div>
            <span className="ml-2 font-medium text-gray-700">Dokumente hochladen</span>
          </div>
          <div className="flex-1 h-1 mx-4 bg-gray-200">
            <div className={`h-full ${activeStep >= 2 ? 'bg-blue-500' : 'bg-gray-200'}`} style={{width: activeStep >= 2 ? '100%' : '0%'}}></div>
          </div>
          <div className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
              activeStep >= 2 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              2
            </div>
            <span className="ml-2 font-medium text-gray-700">Anforderungen eingeben</span>
          </div>
        </div>
      </div>
      
      {/* Hauptinhalt */}
      <div className="grid grid-cols-1 gap-8">
        {/* Schritt 1: Dokumente hochladen */}
        <div className={`${activeStep !== 1 && 'hidden'}`}>
          <p className="text-gray-600 mb-4">
            Laden Sie Ihre PDF-Dokumente hoch. Diese werden analysiert, um relevante Informationen zu extrahieren.
          </p>
          
          <div 
            className="border-2 border-dashed border-gray-300 rounded-lg p-12 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => document.getElementById('pdf-upload')?.click()}
          >
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
              className="hidden"
              id="pdf-upload"
            />
            <div className="text-gray-400 mb-4">
              <FiUpload className="w-16 h-16 mx-auto" />
            </div>
            <p className="text-center text-gray-600 mb-2">Click to upload or drag and drop</p>
            <p className="text-center text-gray-400 text-sm">PDF (max 10MB)</p>
          </div>
      </div>

        {/* Schritt 2: Anforderungen eingeben */}
        <div className={`${activeStep !== 2 && 'hidden'}`}>
          {file && (
            <div className="mb-6 bg-blue-50 p-4 rounded-lg flex items-center">
              <FiCheckCircle className="text-green-500 w-6 h-6 mr-3" />
      <div>
                <p className="font-medium">Ausgewählte Datei:</p>
                <p className="text-sm text-gray-600">{file.name} ({Math.round(file.size / 1024)} KB)</p>
              </div>
              <button 
                className="ml-auto text-blue-500 hover:text-blue-700"
                onClick={() => {
                  setFile(null);
                  setActiveStep(1);
                }}
              >
                Ändern
              </button>
            </div>
          )}
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Suchbegriffe eingeben</h2>
            <p className="text-gray-600 mb-4">
              Gib die Begriffe ein, nach denen du im Dokument suchen möchtest. Jeder Begriff in einer neuen Zeile.
            </p>
            
            <textarea
          value={requirements}
          onChange={(e) => setRequirements(e.target.value)}
              placeholder="z.B. Wärmerückgewinnung&#10;Baumwolle&#10;Energieeffizienz"
              className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              rows={6}
            />
            
            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setActiveStep(1)}
                className="mr-4 px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Zurück
              </button>
              <button 
          onClick={processRequirements}
                disabled={!requirements.trim()}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  !requirements.trim() 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                Angebot generieren
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fehleranzeige */}
      {error && (
        <div className="mt-8 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <div className="flex items-start">
            <FiAlertCircle className="text-red-500 w-5 h-5 mr-2 mt-0.5" />
      <div>
              <p className="font-bold text-red-700">Fehler</p>
              <p className="text-red-600">{error}</p>
            </div>
          </div>
      </div>
      )}
    </div>
  );
}