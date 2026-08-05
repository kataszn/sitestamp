import React, { useState, useRef } from "react";
import { useToast } from "./Toast";

interface EvidenceUploadFormProps {
  onUpload: (formData: FormData) => Promise<void>;
}

export const EvidenceUploadForm: React.FC<EvidenceUploadFormProps> = ({ onUpload }) => {
  const { showToast } = useToast();
  const [image, setImage] = useState<File | null>(null);
  const [textNote, setTextNote] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const durationIntervalRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const startRecording = async () => {
    try {
      chunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Decide options based on supported types (standard MediaRecorder support)
      let options = {};
      if (MediaRecorder.isTypeSupported("audio/wav")) {
        options = { mimeType: "audio/wav" };
      } else if (MediaRecorder.isTypeSupported("audio/webm")) {
        options = { mimeType: "audio/webm" };
      }

      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        // Build final blob
        const blobType = recorder.mimeType || "audio/wav";
        const finalBlob = new Blob(chunksRef.current, { type: blobType });
        setAudioBlob(finalBlob);
        setAudioUrl(URL.createObjectURL(finalBlob));
      };

      recorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration counter
      durationIntervalRef.current = window.setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Failed to start audio recording", err);
      showToast("Microphone permission denied or device not supported.", "error");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    setIsRecording(false);
  };

  const handlePlay = () => {
    if (!audioUrl) return;
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleDeleteAudio = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingDuration(0);
    setIsPlaying(false);
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", image);

      // Audio takes precedence over text when both are present
      if (audioBlob) {
        // Name must match swagger spec (which mentions 'audio' binary file field)
        const ext = audioBlob.type.includes("webm") ? "webm" : "wav";
        formData.append("audio", audioBlob, `note.${ext}`);
      } else if (textNote.trim()) {
        formData.append("note", textNote.trim());
      }

      await onUpload(formData);

      // Reset Form State
      setImage(null);
      setTextNote("");
      setAudioBlob(null);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
      setRecordingDuration(0);
      setIsPlaying(false);
      const fileInput = document.getElementById("evidenceImage") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      showToast("✓ Evidence Added", "success");
    } catch (err) {
      console.error("Upload failed", err);
      showToast("Failed to upload evidence. Please try again.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card">
      <h3 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "16px", margin: "0 0 14px" }}>
        Add Inspection Evidence
      </h3>

      <div className="form-group">
        <label htmlFor="evidenceImage">Photo *</label>
        <input
          id="evidenceImage"
          type="file"
          accept="image/*"
          className="form-control"
          onChange={handleImageChange}
          required
          disabled={isUploading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="textNote">Observation (Optional)</label>
        <input
          id="textNote"
          type="text"
          className="form-control"
          placeholder="e.g. Observed concrete spalling beneath mid-span deck"
          value={textNote}
          onChange={(e) => setTextNote(e.target.value)}
          disabled={isUploading}
        />
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          margin: "4px 0 12px",
          color: "var(--steel)",
          fontFamily: "IBM Plex Mono, monospace",
          fontSize: "11px",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        <span style={{ flex: 1, height: "1px", background: "var(--line)" }} />
        Prefer speaking instead?
        <span style={{ flex: 1, height: "1px", background: "var(--line)" }} />
      </div>

      <div className="form-group">
        <div className="audio-recorder">
          {isRecording ? (
            <div className="recording-indicator">
              <span className="dot" />
              <span>Recording... ({recordingDuration}s)</span>
            </div>
          ) : audioBlob ? (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                <span style={{ fontSize: "16px" }}>✓</span>
                <span style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "14px", fontWeight: 600 }}>
                  Voice note added
                </span>
                <span
                  style={{
                    marginLeft: "auto",
                    fontFamily: "IBM Plex Mono, monospace",
                    fontSize: "12px",
                    color: "var(--steel)",
                  }}
                >
                  {formatDuration(recordingDuration)}
                </span>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  className="btn"
                  style={{ background: "var(--blueprint)" }}
                  onClick={handlePlay}
                  disabled={isUploading}
                >
                  {isPlaying ? "Playing..." : "Play"}
                </button>
                <button
                  type="button"
                  className="btn"
                  style={{ background: "transparent", color: "var(--critical)", border: "1.5px solid var(--critical)" }}
                  onClick={handleDeleteAudio}
                  disabled={isUploading}
                >
                  Delete
                </button>
              </div>

              <div style={{ marginTop: "10px", fontFamily: "IBM Plex Mono, monospace", fontSize: "11px", color: "var(--steel)" }}>
                The voice note will be transcribed automatically.
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: "11px", color: "var(--steel)", marginBottom: "10px" }}>
                No voice note added
              </div>
              <button
                type="button"
                className="btn"
                style={{ background: "var(--blueprint)" }}
                onClick={startRecording}
                disabled={isUploading}
              >
                Record Voice
              </button>
            </div>
          )}

          {isRecording && (
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                className="btn"
                style={{ background: "var(--critical)" }}
                onClick={stopRecording}
                disabled={isUploading}
              >
                Stop
              </button>
            </div>
          )}
        </div>

        {/* Hidden audio element for playback */}
        {audioUrl && (
          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
            onPause={() => setIsPlaying(false)}
            style={{ display: "none" }}
          />
        )}
      </div>

      <div style={{ marginTop: "20px" }}>
        <button
          type="submit"
          className="btn"
          style={{ width: "100%" }}
          disabled={isUploading || !image}
        >
          {isUploading ? "Uploading Evidence..." : "Save Evidence"}
        </button>
      </div>
    </form>
  );
};

export default EvidenceUploadForm;
