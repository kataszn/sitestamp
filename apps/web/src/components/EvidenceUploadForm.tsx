import React, { useState, useRef } from "react";
import { useToast } from "./Toast";

interface EvidenceUploadFormProps {
  onUpload: (formData: FormData) => Promise<void>;
}

export const EvidenceUploadForm: React.FC<EvidenceUploadFormProps> = ({ onUpload }) => {
  const { showToast } = useToast();
  const [image, setImage] = useState<File | null>(null);
  const [noteMode, setNoteMode] = useState<"text" | "audio">("text");
  const [textNote, setTextNote] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const durationIntervalRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", image);

      if (noteMode === "text" && textNote.trim()) {
        formData.append("note", textNote.trim());
      } else if (noteMode === "audio" && audioBlob) {
        // Name must match swagger spec (which mentions 'audio' binary file field)
        const ext = audioBlob.type.includes("webm") ? "webm" : "wav";
        formData.append("audio", audioBlob, `note.${ext}`);
      }

      await onUpload(formData);

      // Reset Form State
      setImage(null);
      setTextNote("");
      setAudioBlob(null);
      setRecordingDuration(0);
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

      <div className="form-group" style={{ marginBottom: "12px" }}>
        <label>Observation (Optional)</label>
        <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
          <button
            type="button"
            className="btn"
            style={{
              flex: 1,
              background: noteMode === "text" ? "var(--blueprint)" : "var(--blueprint-soft)",
              color: noteMode === "text" ? "var(--sheet)" : "var(--ink)",
            }}
            onClick={() => setNoteMode("text")}
            disabled={isUploading}
          >
            Text
          </button>
          <button
            type="button"
            className="btn"
            style={{
              flex: 1,
              background: noteMode === "audio" ? "var(--blueprint)" : "var(--blueprint-soft)",
              color: noteMode === "audio" ? "var(--sheet)" : "var(--ink)",
            }}
            onClick={() => setNoteMode("audio")}
            disabled={isUploading}
          >
            Voice
          </button>
        </div>
      </div>

      {noteMode === "text" ? (
        <div className="form-group">
          <label htmlFor="textNote"></label>
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
      ) : (
        <div className="form-group">
          <label></label>
          <div className="audio-recorder">
            {isRecording ? (
              <div className="recording-indicator">
                <span className="dot" />
                <span>Recording Voice Note... ({recordingDuration}s)</span>
              </div>
            ) : (
              <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: "11px", color: "var(--steel)" }}>
                {audioBlob ? "🎙️ Voice note recorded successfully!" : "No voice note recorded yet."}
              </div>
            )}

            <div style={{ display: "flex", gap: "8px" }}>
              {!isRecording ? (
                <button
                  type="button"
                  className="btn"
                  style={{ background: "var(--blueprint)" }}
                  onClick={startRecording}
                  disabled={isUploading}
                >
                  Record
                </button>
              ) : (
                <button
                  type="button"
                  className="btn"
                  style={{ background: "var(--critical)" }}
                  onClick={stopRecording}
                  disabled={isUploading}
                >
                  Stop
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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
