import React, { useState, useRef } from "react";
import { useToast } from "./Toast";

interface EvidenceUploadFormProps {
  onUpload: (formData: FormData) => Promise<void>;
}

export const EvidenceUploadForm: React.FC<EvidenceUploadFormProps> = ({ onUpload }) => {
  const { showToast } = useToast();
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
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
  const stopResolverRef = useRef<((blob: Blob | null) => void) | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleChangePhoto = () => {
    const fileInput = document.getElementById("evidenceImage") as HTMLInputElement;
    if (fileInput) fileInput.click();
  };

  const handleRemovePhoto = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setImage(null);
    const fileInput = document.getElementById("evidenceImage") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
        // Resolve any pending "stop and wait for blob" promise from submit
        if (stopResolverRef.current) {
          stopResolverRef.current(finalBlob);
          stopResolverRef.current = null;
        }
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

  const stopRecording = (): Promise<Blob | null> => {
    // If a recording is in progress, stop it and wait for the final blob to be
    // assembled in the onstop handler before resolving.
    if (mediaRecorderRef.current && isRecording) {
      const promise = new Promise<Blob | null>((resolve) => {
        stopResolverRef.current = resolve;
        mediaRecorderRef.current!.stop();
      });
      // Clean up the stream and duration counter regardless of blob assembly
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      setIsRecording(false);
      return promise;
    }
    return Promise.resolve(null);
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
      // If a voice recording is still in progress, stop it first and wait for
      // the final blob so it gets included in the upload.
      let blobToUpload = audioBlob;
      if (isRecording) {
        const stoppedBlob = await stopRecording();
        if (stoppedBlob) blobToUpload = stoppedBlob;
      }

      const formData = new FormData();
      formData.append("image", image);

      // Audio takes precedence over text when both are present
      if (blobToUpload) {
        // Name must match swagger spec (which mentions 'audio' binary file field)
        const ext = blobToUpload.type.includes("webm") ? "webm" : "wav";
        formData.append("audio", blobToUpload, `note.${ext}`);
      } else if (textNote.trim()) {
        formData.append("note", textNote.trim());
      }

      await onUpload(formData);

      // Reset Form State
      setImage(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
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
          style={{ display: "none" }}
        />

        {previewUrl && image ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              padding: "12px",
              border: "1.5px solid var(--line)",
              borderRadius: "10px",
              background: "var(--surface)",
            }}
          >
            <div
              style={{
                width: "72px",
                height: "72px",
                flexShrink: 0,
                borderRadius: "8px",
                overflow: "hidden",
                border: "1px solid var(--line)",
                background: "var(--blueprint)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                src={previewUrl}
                alt="Photo preview"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: "Space Grotesk, sans-serif",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "var(--ink)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {image.name}
              </div>
              <div
                style={{
                  fontFamily: "IBM Plex Mono, monospace",
                  fontSize: "12px",
                  color: "var(--steel)",
                  marginTop: "2px",
                }}
              >
                {formatFileSize(image.size)}
              </div>
              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                <button
                  type="button"
                  className="btn"
                  style={{
                    background: "transparent",
                    color: "var(--blueprint)",
                    border: "1.5px solid var(--blueprint)",
                    padding: "4px 12px",
                    fontSize: "12px",
                  }}
                  onClick={handleChangePhoto}
                  disabled={isUploading}
                >
                  Change
                </button>
                <button
                  type="button"
                  className="btn"
                  style={{
                    background: "transparent",
                    color: "var(--critical)",
                    border: "1.5px solid var(--critical)",
                    padding: "4px 12px",
                    fontSize: "12px",
                  }}
                  onClick={handleRemovePhoto}
                  disabled={isUploading}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            onClick={handleChangePhoto}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "28px 16px",
              border: "1.5px dashed var(--line)",
              borderRadius: "10px",
              background: "var(--surface)",
              cursor: "pointer",
              color: "var(--steel)",
              fontFamily: "IBM Plex Mono, monospace",
              fontSize: "12px",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            <span style={{ fontSize: "22px" }}>📷</span>
            <span>Click to choose a photo</span>
          </div>
        )}
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
        OR
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
