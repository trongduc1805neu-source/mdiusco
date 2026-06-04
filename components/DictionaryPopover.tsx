import React, { useRef, useMemo } from 'react';
import { Volume2, X } from 'lucide-react';
import IconBadge from './IconBadge';

// Define the structure of the API response for clarity
interface Phonetic {
    text: string;
    audio?: string;
}

interface Definition {
    definition: string;
    example?: string;
}

interface Meaning {
    partOfSpeech: string;
    definitions: Definition[];
    synonyms: string[];
}

interface DictionaryEntry {
    word: string;
    phonetic?: string;
    phonetics: Phonetic[];
    meanings: Meaning[];
}

interface DictionaryPopoverProps {
  data: any;
  vietnameseTranslation?: string | null;
  isLoading: boolean;
  position: { top: number; left: number; positionAbove: boolean };
  word: string;
  onClose: () => void;
}

const DictionaryPopover = React.forwardRef<HTMLDivElement, DictionaryPopoverProps>(
  ({ data, vietnameseTranslation, isLoading, position, word, onClose }, ref) => {
    const audioRef = useRef<HTMLAudioElement>(null);

    const apiData = Array.isArray(data) ? data[0] : null;

    const audioUrl = useMemo(() => {
        if (!apiData) return null;
        for (const phonetic of apiData.phonetics) {
            if (phonetic.audio) {
                return phonetic.audio;
            }
        }
        return null;
    }, [apiData]);

    const synonyms = useMemo(() => {
        if (!apiData) return [];
        const allSynonyms = new Set<string>();
        apiData.meanings.forEach(meaning => {
            if(meaning.synonyms) {
                meaning.synonyms.forEach(synonym => allSynonyms.add(synonym));
            }
        });
        return Array.from(allSynonyms);
    }, [apiData]);

    const handlePlayAudio = () => {
        if (audioRef.current) {
            audioRef.current.play().catch(e => console.error("Error playing audio:", e));
        }
    };

    const renderContent = () => {
        if (isLoading) {
            return <div className="loaders">Loading definition...</div>;
        }

        const entry = apiData;
        const hasEntry = !!entry;

        return (
            <>
                <div className="dictionary-header">
                    <div className="dictionary-word-section">
                        <div>
                            <h2 className="dictionary-word" style={{ textTransform: 'capitalize' }}>{entry?.word || word}</h2>
                            {entry?.phonetic && <p className="dictionary-phonetic">{entry.phonetic}</p>}
                            {vietnameseTranslation && (
                                <p style={{ 
                                    margin: '4px 0 0 0', 
                                    fontSize: '0.85rem', 
                                    fontWeight: 700, 
                                    color: 'var(--color-primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}>
                                    <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Nghĩa:</span> {vietnameseTranslation}
                                </p>
                            )}
                        </div>
                        {audioUrl && (
                            <button className="pronounce-btn" onClick={handlePlayAudio} aria-label="Phát âm" style={{ alignSelf: 'flex-start', marginTop: '4px' }}>
                                <Volume2 size={14} strokeWidth={2.5} />
                            </button>
                        )}
                    </div>
                    <button className="close-dictionary-btn" onClick={onClose} aria-label="Đóng từ điển">
                        <X size={14} strokeWidth={2.5} />
                    </button>
                </div>
                <div className="dictionary-body scrollbar-hide">
                    {hasEntry ? (
                        <>
                            {entry.meanings.map((meaning: any, index: number) => (
                                <div key={index} className="meaning-block">
                                    <h3 className="part-of-speech">{meaning.partOfSpeech}</h3>
                                    <ol className="definition-list">
                                        {meaning.definitions.map((def: any, defIndex: number) => (
                                            <li key={defIndex} className="definition-item">
                                                <p className="definition-text">{def.definition}</p>
                                                {def.example && <p className="definition-example">"{def.example}"</p>}
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            ))}
                            {synonyms.length > 0 && (
                                <div className="synonyms-section">
                                    <h4 className="synonyms-title">Synonyms</h4>
                                    <div className="synonyms-list">
                                        {synonyms.map(s => <span key={s} className="synonym-tag">{s}</span>)}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={{ padding: '8px 0', fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            Không tìm thấy định nghĩa chi tiết bằng tiếng Anh.
                        </div>
                    )}
                </div>
            </>
        );
    };

    return (
        <div 
            className="dictionary-popover" 
            ref={ref} 
            style={{ 
                top: `${position.top}px`, 
                left: `${position.left}px`,
                transform: position.positionAbove ? 'translateY(-100%)' : 'none'
            }}
        >
            {renderContent()}
            {audioUrl && <audio ref={audioRef} src={audioUrl} preload="auto" />}
        </div>
    );
  }
);

export default DictionaryPopover;
